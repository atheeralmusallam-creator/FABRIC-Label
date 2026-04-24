// src/app/api/tasks/[taskId]/skip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: { status: "SKIPPED" },
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to skip task" }, { status: 500 });
  }
}
