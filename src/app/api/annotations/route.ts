// src/app/api/annotations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProject } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, result, notes, status } = body;
    const annotationStatus = status === "DRAFT" ? "DRAFT" : "SUBMITTED";

    if (!taskId || !result) {
      return NextResponse.json({ error: "taskId and result are required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { user, allowed } = await canAccessProject(task.projectId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const annotation = await prisma.annotation.upsert({
      where: { taskId_userId: { taskId, userId: user.id } },
      update: { result, notes, status: annotationStatus },
      create: { taskId, result, notes, userId: user.id, status: annotationStatus },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (annotationStatus === "SUBMITTED") {
      const assignedCount = await prisma.taskAssignment.count({ where: { taskId } });
      if (assignedCount === 0) {
        await prisma.task.update({ where: { id: taskId }, data: { status: "SUBMITTED" } });
      } else {
        const submittedCount = await prisma.annotation.count({ where: { taskId, status: "SUBMITTED" } });
        if (submittedCount >= assignedCount) {
          await prisma.task.update({ where: { id: taskId }, data: { status: "SUBMITTED" } });
        }
      }
    }

    return NextResponse.json(annotation, { status: annotationStatus === "DRAFT" ? 200 : 201 });
  } catch (error) {
    console.error("POST /api/annotations error:", error);
    return NextResponse.json({ error: "Failed to save annotation" }, { status: 500 });
  }
}
