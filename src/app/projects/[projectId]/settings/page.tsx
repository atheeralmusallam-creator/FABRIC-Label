export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProjectTypeLabel, getProjectTypeIcon, formatDate } from "@/lib/utils";
import { ProjectType } from "@/types";
import { requireRole } from "@/lib/auth";

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        // ✅ UPDATED (بدل take:1)
        include: { annotations: { include: { user: true } } },
      },
      assignments: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

async function assignUserAction(formData: FormData) {
  "use server";
  await requireRole(["ADMIN", "MANAGER"]);
  const projectId = String(formData.get("projectId") || "");
  const userId = String(formData.get("userId") || "");
  if (projectId && userId) {
    await prisma.projectAssignment.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId },
    });
  }
}

async function removeAssignmentAction(formData: FormData) {
  "use server";
  await requireRole(["ADMIN", "MANAGER"]);
  const id = String(formData.get("id") || "");
  if (id) await prisma.projectAssignment.delete({ where: { id } });
}

export default async function ProjectSettingsPage({
  params,
}: {
  params: { projectId: string };
}) {
  await requireRole(["ADMIN", "MANAGER"]);
  const project = await getProject(params.projectId);
  if (!project) notFound();

  const total = project.tasks.length;
  const submitted = project.tasks.filter((t) => t.status === "SUBMITTED").length;
  const skipped = project.tasks.filter((t) => t.status === "SKIPPED").length;
  const pending = project.tasks.filter((t) => t.status === "PENDING").length;
  const progress = total > 0 ? Math.round(((submitted + skipped) / total) * 100) : 0;

  const annotators = await prisma.user.findMany({
    where: { role: "ANNOTATOR" },
    orderBy: { email: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0e0f14]">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm">Projects</Link>
          <span className="text-gray-700">/</span>
          <Link href={`/projects/${project.id}`} className="text-gray-500 hover:text-white text-sm">
            {project.name}
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-white">Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Project info */}
        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h1 className="text-xl font-bold text-white">{project.name}</h1>
        </div>

        {/* Comparison Dashboard */}
        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Comparison Dashboard
          </h2>

          <div className="space-y-4">
            {project.tasks.map((task, i) => {
              const data = task.data as any;

              return (
                <div key={task.id} className="border border-[#2a2d3e] rounded-lg p-4 bg-[#0e0f14]">
                  
                  <div className="text-xs text-gray-500 mb-2">
                    Task {i + 1}
                  </div>

                  <div className="text-sm text-gray-300 mb-3">
                    {data.prompt || data.question || data.text || "—"}
                  </div>

                  <div className="space-y-2">
                    {task.annotations.map((ann) => {
                      const r = ann.result as any;

                      return (
                        <div
                          key={ann.id}
                          className="text-xs border border-[#2a2d3e] rounded-md px-3 py-2 flex justify-between"
                        >
                          <span className="text-gray-400">
                            {ann.user?.email || "Unknown"}
                          </span>

                          <span className="flex gap-4 text-gray-300">
                            <span>{r?.rating || "—"}</span>
                            <span>{r?.severity || "—"}</span>
                            <span className="text-gray-500">
                              {ann.notes || "—"}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
