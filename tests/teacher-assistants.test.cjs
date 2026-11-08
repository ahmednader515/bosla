const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, console, process, require(name) { if (name in dependencies) return dependencies[name]; return require(name); } }, { filename: file });
  return module.exports;
}
const permissions = load('lib/permissions.ts');
test('assistants can manage only their assigned teacher courses', () => {
  const assistant = { id: 'assistant-a', role: 'TEACHER_ASSISTANT', teacherId: 'teacher-a' };
  const scope = permissions.teacherScopeId(assistant);
  assert.equal(permissions.canManageCourse(assistant.role, scope, 'teacher-a'), true);
  assert.equal(permissions.canManageCourse(assistant.role, scope, 'teacher-b'), false);
  assert.equal(permissions.canManageCourse(assistant.role, scope, null), false);
  assert.equal(permissions.canManageCourse(assistant.role, permissions.teacherScopeId({ ...assistant, teacherId: undefined }), 'teacher-a'), false);
  assert.equal(permissions.canManageCourse('STUDENT', 'teacher-a', 'teacher-a'), false);
  assert.equal(permissions.teacherScopeId({ id: 'teacher-a', role: 'TEACHER' }), 'teacher-a');
});
function setup(role = 'ADMIN') {
  const state = { deleted: [], created: [], session: { user: { id: 'admin', role } }, target: { id: 'assistant-a', role: 'TEACHER_ASSISTANT', teacher_id: 'teacher-a' } };
  const db = {
    getTeachersFeatureEnabled: async () => true,
    getUserById: async (id) => id === 'teacher-a' ? { id, role: 'TEACHER' } : state.target,
    listTeacherAssistants: async () => [{ id: 'assistant-a', name: 'Assistant', email: 'assistant@example.com' }],
    createTeacherAssistant: async (id, data) => { state.created.push({ id, ...data }); return 'assistant-new'; },
    deleteUserAccount: async (id) => { state.deleted.push(id); },
  };
  const dependencies = { '@/lib/auth': { authOptions: {} }, '@/lib/db': db, 'next-auth': { getServerSession: async () => state.session } };
  return { state, collection: load('app/api/dashboard/teachers/[id]/assistants/route.ts', dependencies), item: load('app/api/dashboard/teachers/[id]/assistants/[assistantId]/route.ts', dependencies) };
}
const context = () => ({ params: Promise.resolve({ id: 'teacher-a', assistantId: 'assistant-a' }) });
const request = (body) => ({ json: async () => body });
test('only admins may list, create, or delete assistants', async () => {
  for (const role of ['STUDENT', 'TEACHER', 'TEACHER_ASSISTANT', 'ASSISTANT_ADMIN']) {
    const { state, collection, item } = setup(role);
    assert.equal((await collection.GET({}, context())).status, 403);
    assert.equal((await collection.POST(request({}), context())).status, 403);
    assert.equal((await item.DELETE({}, context())).status, 403);
    assert.equal(state.created.length + state.deleted.length, 0);
  }
});
test('admin can create multiple accounts with hashed passwords and normalized email', async () => {
  const { state, collection } = setup();
  for (const email of [' Assistant@One.com ', 'assistant@two.com']) {
    assert.equal((await collection.POST(request({ name: 'Assistant', email, password: 'secret123' }), context())).status, 201);
  }
  assert.equal(state.created.length, 2);
  assert.equal(state.created[0].id, 'teacher-a');
  assert.equal(state.created[0].email, 'assistant@one.com');
  assert.notEqual(state.created[0].password_hash, 'secret123');
  assert.equal((await collection.POST(request({ name: 'A', email: 'invalid', password: '123' }), context())).status, 400);
});
test('deletion refuses another teacher assistant and non-assistant accounts', async () => {
  const { state, item } = setup();
  state.target.teacher_id = 'teacher-b';
  assert.equal((await item.DELETE({}, context())).status, 404);
  state.target.teacher_id = 'teacher-a'; state.target.role = 'TEACHER';
  assert.equal((await item.DELETE({}, context())).status, 404);
  state.target.role = 'TEACHER_ASSISTANT';
  assert.equal((await item.DELETE({}, context())).status, 200);
  assert.deepEqual(state.deleted, ['assistant-a']);
});

test('assistant sessions retain their own identity and revoked accounts lose access', async () => {
  const accounts = {
    assistant: { id: 'assistant', role: 'TEACHER_ASSISTANT', teacher_id: 'teacher' },
    teacher: { id: 'teacher', role: 'TEACHER' },
  };
  const { authOptions } = load('lib/auth.ts', {
    '@/lib/db': { getUserById: async (id) => accounts[id] ?? null, getCurrentSessionId: async () => 'session-id' },
    '@/lib/auth-constants': { CONCURRENT_SESSION_ERROR: 'concurrent' },
  });
  const invoke = () => authOptions.callbacks.session({ session: { user: { id: 'assistant', name: 'Assistant' } }, token: { id: 'assistant', role: 'TEACHER_ASSISTANT', sessionId: 'session-id' } });
  const session = await invoke();
  assert.equal(session.user.id, 'assistant');
  assert.equal(session.user.teacherId, 'teacher');
  delete accounts.teacher;
  assert.equal(await invoke(), null);
  delete accounts.assistant;
  assert.equal(await invoke(), null);
});
