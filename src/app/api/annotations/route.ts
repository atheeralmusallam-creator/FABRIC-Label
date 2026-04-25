// src/app/api/annotations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProject } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, result, notes } = body;

    if (!taskId || !result) {
      return NextResponse.json({ error: "taskId and result are required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const { user, allowed } = await canAccessProject(task.projectId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Upsert: delete old + create new (one annotation per task for MVP)
    await prisma.annotation.deleteMany({ where: { taskId } });

    const annotation = await prisma.annotation.create({
      data: { taskId, result, notes, userId: user.id },
    });

    // Mark task as submitted
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "SUBMITTED" },
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("POST /api/annotations error:", error);
    return NextResponse.json({ error: "Failed to save annotation" }, { status: 500 });
  }
}
