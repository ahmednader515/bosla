import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUserAccount, getUserById } from "@/lib/db";
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; assistantId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id, assistantId } = await params;
  const assistant = await getUserById(assistantId);
  if (assistant?.role !== "TEACHER_ASSISTANT" || assistant.teacher_id !== id) return NextResponse.json({ error: "المساعد غير موجود" }, { status: 404 });
  await deleteUserAccount(assistantId);
  return NextResponse.json({ success: true });
}
