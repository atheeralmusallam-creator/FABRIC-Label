// src/app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        annotations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await request.json();
    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: { status: body.status },
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
