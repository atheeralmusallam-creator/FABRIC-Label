export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectAnnotator } from "@/components/layout/ProjectAnnotator";
import { canAccessProject } from "@/lib/auth";

async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: { annotations: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
}

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const { allowed } = await canAccessProject(params.projectId);
  if (!allowed) redirect("/dashboard");
  const project = await getProject(params.projectId);
  if (!project) notFound();
  return <ProjectAnnotator project={project as any} />;
}
