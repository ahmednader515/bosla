import type { UserRole } from "@/lib/types";

export function isTeacherRole(role: string): boolean {
  return role === "TEACHER" || role === "TEACHER_ASSISTANT";
}

export function teacherScopeId(user: { id: string; role: string; teacherId?: string }): string {
  return user.role === "TEACHER_ASSISTANT" ? (user.teacherId ?? "") : user.id;
}


export function isStaffRole(role: string): role is "ADMIN" | "ASSISTANT_ADMIN" | "TEACHER" | "TEACHER_ASSISTANT" {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || isTeacherRole(role);
}

/** أدمن أو مساعد: يديرون كل الكورسات؛ مدرس: كورساته فقط */
export function canManageCourse(
  role: UserRole | string,
  sessionUserId: string,
  courseCreatedById: string | null | undefined,
): boolean {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  if (isTeacherRole(role)) {
    return !!courseCreatedById && courseCreatedById === sessionUserId;
  }
  return false;
}
