import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createTeacherAssistant, getTeachersFeatureEnabled, getUserById, listTeacherAssistants } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({ name: z.string().trim().min(2).max(200), email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(6).max(72) });
export async function GET(_request: NextRequest, { params }: Context) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const teacher = await getUserById(id);
  if (teacher?.role !== "TEACHER") return NextResponse.json({ error: "المدرس غير موجود" }, { status: 404 });
  return NextResponse.json({ assistants: await listTeacherAssistants(id) });
}
export async function POST(request: NextRequest, { params }: Context) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  if (!(await getTeachersFeatureEnabled())) return NextResponse.json({ error: "فعّل ميزة المدرسين أولاً" }, { status: 400 });
  const { id } = await params;
  const teacher = await getUserById(id);
  if (teacher?.role !== "TEACHER") return NextResponse.json({ error: "المدرس غير موجود" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "الاسم والبريد الصحيح وكلمة مرور من 6 إلى 72 حرفاً مطلوبة" }, { status: 400 });
  try {
    const assistantId = await createTeacherAssistant(id, { name: parsed.data.name, email: parsed.data.email, password_hash: await hash(parsed.data.password, 12) });
    return NextResponse.json({ id: assistantId }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return NextResponse.json({ error: "البريد مستخدم مسبقاً" }, { status: 409 });
    console.error("Create teacher assistant", error);
    return NextResponse.json({ error: "تعذر إنشاء المساعد" }, { status: 500 });
  }
}
