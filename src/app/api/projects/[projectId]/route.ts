// src/app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessProject, requireRole } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { allowed } = await canAccessProject(params.projectId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        tasks: {
          orderBy: { order: "asc" },
          include: {
            annotations: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const tasks = project.tasks;
    const total = tasks.length;
    const submitted = tasks.filter((t) => t.status === "SUBMITTED").length;
    const skipped = tasks.filter((t) => t.status === "SKIPPED").length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;

    return NextResponse.json({
      ...project,
      stats: {
        total,
        submitted,
        skipped,
        pending,
        progress: total > 0 ? Math.round(((submitted + skipped) / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const { allowed } = await canAccessProject(params.projectId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const project = await prisma.project.update({
      where: { id: params.projectId },
      data: body,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const { allowed } = await canAccessProject(params.projectId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: params.projectId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
