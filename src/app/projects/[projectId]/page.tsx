export const dynamic = 'force-dynamic';

// src/app/projects/[projectId]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectAnnotator } from "@/components/layout/ProjectAnnotator";

async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: {
          annotations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  return project;
}

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const project = await getProject(params.projectId);
  if (!project) notFound();

  return <ProjectAnnotator project={project as any} />;
}
