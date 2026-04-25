export const dynamic = 'force-dynamic';

// src/app/projects/[projectId]/settings/page.tsx
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
        include: { annotations: { take: 1 } },
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
  const annotators = await prisma.user.findMany({ where: { role: "ANNOTATOR" }, orderBy: { email: "asc" } });

  return (
    <div className="min-h-screen bg-[#0e0f14]">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">Projects</Link>
          <span className="text-gray-700">/</span>
          <Link href={`/projects/${project.id}`} className="text-gray-500 hover:text-white transition-colors text-sm">
            {project.name}
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-white">Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Project info */}
        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getProjectTypeIcon(project.type as ProjectType)}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/projects/${project.id}/import`}
                className="text-sm px-4 py-2 bg-[#1a1d27] border border-[#2a2d3e] hover:border-indigo-500/50 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                ⬆️ Import Tasks
              </Link>
              <Link
                href={`/projects/${project.id}`}
                className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Annotate →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {[
              { label: "Total Tasks", value: total, color: "text-white" },
              { label: "Submitted",   value: submitted, color: "text-green-400" },
              { label: "Skipped",     value: skipped, color: "text-yellow-400" },
              { label: "Pending",     value: pending, color: "text-gray-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#0e0f14] rounded-lg p-3 border border-[#2a2d3e]">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[#2a2d3e] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        {/* Export */}
        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Export Annotations</h2>
          <p className="text-xs text-gray-500 mb-4">
            Download all submitted annotations with task data.
          </p>
          <div className="flex gap-3">
            <a
              href={`/api/projects/${project.id}/export?format=json`}
              download
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1d27] border border-[#2a2d3e] hover:border-indigo-500/50 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
            >
              📄 Export JSON
            </a>
            <a
              href={`/api/projects/${project.id}/export?format=csv`}
              download
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1d27] border border-[#2a2d3e] hover:border-indigo-500/50 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
            >
              📊 Export CSV
            </a>
          </div>
        </div>

        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Assigned Annotators</h2>
          <p className="text-xs text-gray-500 mb-4">Annotators only see projects assigned to them.</p>
          <form action={assignUserAction} className="flex gap-3 mb-4">
            <input type="hidden" name="projectId" value={project.id} />
            <select name="userId" className="flex-1 rounded-lg bg-[#0e0f14] border border-[#2a2d3e] px-3 py-2 text-sm text-gray-200">
              {annotators.map((user) => (
                <option key={user.id} value={user.id}>{user.name || user.email} — {user.email}</option>
              ))}
            </select>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Assign</button>
          </form>
          <div className="space-y-2">
            {project.assignments.length === 0 ? (
              <div className="text-sm text-gray-500">No annotators assigned.</div>
            ) : project.assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-lg bg-[#0e0f14] border border-[#2a2d3e] px-3 py-2">
                <div>
                  <div className="text-sm text-white">{assignment.user.name || assignment.user.email}</div>
                  <div className="text-xs text-gray-500">{assignment.user.email}</div>
                </div>
                <form action={removeAssignmentAction}>
                  <input type="hidden" name="id" value={assignment.id} />
                  <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks list */}
        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Tasks ({total})
          </h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600 uppercase tracking-wide border-b border-[#2a2d3e]">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Preview</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Annotated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]">
                {project.tasks.map((task, i) => {
                  const data = task.data as any;
                  const preview = data.text?.slice(0, 60) ?? data.question?.slice(0, 60) ?? data.title?.slice(0, 60) ?? data.caption ?? data.description ?? "—";
                  const annotation = task.annotations[0];
                  return (
                    <tr key={task.id} className="hover:bg-[#1a1d27] transition-colors">
                      <td className="py-2.5 pr-4 text-gray-600 text-xs">{i + 1}</td>
                      <td className="py-2.5 pr-4 text-gray-400 text-xs max-w-xs">
                        <span className="truncate block">{preview}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.status === "SUBMITTED" ? "status-submitted" :
                          task.status === "SKIPPED"   ? "status-skipped" :
                          "status-pending"
                        }`}>
                          {task.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-gray-600">
                        {annotation ? formatDate(annotation.createdAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danger zone */}
        <DangerZone projectId={project.id} />
      </main>
    </div>
  );
}

function DangerZone({ projectId }: { projectId: string }) {
  return (
    <div className="bg-[#13151e] border border-red-900/40 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
      <p className="text-xs text-gray-500 mb-4">
        Deleting a project will remove all tasks and annotations permanently.
      </p>
      <DeleteProjectButton projectId={projectId} />
    </div>
  );
}

// Client component for delete
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton";
