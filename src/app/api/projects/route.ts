// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await prisma.project.findMany({
      where: user.role === "ANNOTATOR" ? { assignments: { some: { userId: user.id } } } : {},
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
    });

    const projectsWithStats = projects.map((p) => {
      const total = p.tasks.length;
      const submitted = p.tasks.filter((t) => t.status === "SUBMITTED").length;
      const skipped = p.tasks.filter((t) => t.status === "SKIPPED").length;
      const pending = p.tasks.filter((t) => t.status === "PENDING").length;
      return {
        ...p,
        tasks: undefined,
        stats: {
          total,
          submitted,
          skipped,
          pending,
          progress: total > 0 ? Math.round(((submitted + skipped) / total) * 100) : 0,
        },
      };
    });

    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);
    const body = await request.json();
    const { name, description, type, config } = body;

    if (!name || !type || !config) {
      return NextResponse.json({ error: "name, type, and config are required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: { name, description, type, config },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
