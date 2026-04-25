export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectAnnotator } from "@/components/layout/ProjectAnnotator";
import { canAccessProject } from "@/lib/auth";

async function getProject(projectId: string, userId: string, role: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: { select: { id: true, name: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      tasks: {
        where: role === "ANNOTATOR" ? { OR: [{ assignments: { some: { userId } } }, { assignments: { none: {} } }] } : {},
        orderBy: { order: "asc" },
        include: {
          annotations: {
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const { user, allowed } = await canAccessProject(params.projectId);
  if (!allowed) redirect("/dashboard");
  const project = await getProject(params.projectId, user.id, user.role);
  if (!project) notFound();
  return <ProjectAnnotator project={project as any} currentUserId={user.id} />;
}
