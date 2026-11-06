import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import {
  getUserById,
  getUserByEmailExcludingId,
  updateUser,
  clearCurrentSessionId,
  deleteUserAccount,
  countUsersByRole,
} from "@/lib/db";

const ROLES = ["ADMIN", "ASSISTANT_ADMIN", "STUDENT"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const targetUser = await getUserById(id);
  if (!targetUser) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const isAssistant = session.user.role === "ASSISTANT_ADMIN";
  if (isAssistant && targetUser.role !== "STUDENT") {
    return NextResponse.json({ error: "يمكنك تعديل حسابات الطلاب فقط" }, { status: 403 });
  }

  let body: { name?: string; email?: string; role?: string; password?: string; student_number?: string | null; guardian_number?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const data: { name?: string; email?: string; role?: "ADMIN" | "ASSISTANT_ADMIN" | "STUDENT"; password_hash?: string; student_number?: string | null; guardian_number?: string | null } = {};

  if (body.name !== undefined && body.name.trim()) data.name = body.name.trim();

  if (!isAssistant) {
    if (body.email !== undefined && body.email.trim()) {
      const existing = await getUserByEmailExcludingId(body.email.trim(), id);
      if (existing) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم لحساب آخر" }, { status: 400 });
      }
      data.email = body.email.trim();
    }
    if (body.role !== undefined && ROLES.includes(body.role as (typeof ROLES)[number])) {
      data.role = body.role as "ADMIN" | "ASSISTANT_ADMIN" | "STUDENT";
    }
  }

  if (body.password !== undefined && body.password.trim().length >= 6) {
    data.password_hash = await hash(body.password.trim(), 12);
  }

  if (body.student_number !== undefined) data.student_number = body.student_number?.trim() || null;
  if (body.guardian_number !== undefined) data.guardian_number = body.guardian_number?.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
  }

  await updateUser(id, data);

  if (data.role !== undefined) {
    await clearCurrentSessionId(id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "لا يمكن حذف حسابك الحالي" }, { status: 400 });
  }

  const targetUser = await getUserById(id);
  if (!targetUser) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const isAssistant = session.user.role === "ASSISTANT_ADMIN";
  if (isAssistant && targetUser.role !== "STUDENT") {
    return NextResponse.json({ error: "يمكنك حذف حسابات الطلاب فقط" }, { status: 403 });
  }

  if (targetUser.role === "ADMIN") {
    const adminCount = await countUsersByRole("ADMIN");
    if (adminCount <= 1) {
      return NextResponse.json({ error: "لا يمكن حذف آخر حساب أدمن" }, { status: 400 });
    }
  }

  try {
    await deleteUserAccount(id);
  } catch (e) {
    console.error("DELETE /api/dashboard/students/[id]", e);
    const raw = e instanceof Error ? e.message : String(e);
    const lower = raw.toLowerCase();
    if (lower.includes("foreign key") || lower.includes("violates")) {
      return NextResponse.json(
        {
          error:
            "تعذر الحذف بسبب ارتباطات أخرى في قاعدة البيانات. احذف الارتباطات أولاً أو تواصل مع الدعم.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "فشل حذف الحساب", detail: raw }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
