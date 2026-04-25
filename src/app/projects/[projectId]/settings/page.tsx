export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { order: "asc" },
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

  const annotators = await prisma.user.findMany({
    where: { role: "ANNOTATOR" },
    orderBy: { email: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0e0f14]">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm">Projects</Link>
          <span className="text-gray-700">/</span>
          <Link href={`/projects/${project.id}`} className="text-gray-500 hover:text-white text-sm">
            {project.name}
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-white">Settings</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h1 className="text-xl font-bold text-white">{project.name}</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="bg-[#0e0f14] border border-[#2a2d3e] rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-xs text-gray-600">Total Tasks</div>
            </div>
            <div className="bg-[#0e0f14] border border-[#2a2d3e] rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{submitted}</div>
              <div className="text-xs text-gray-600">Submitted</div>
            </div>
            <div className="bg-[#0e0f14] border border-[#2a2d3e] rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{skipped}</div>
              <div className="text-xs text-gray-600">Skipped</div>
            </div>
            <div className="bg-[#0e0f14] border border-[#2a2d3e] rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-400">{pending}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Export</h2>
          <p className="text-xs text-gray-500 mb-4">
            Download submitted annotations or IAA report.
          </p>

          <div className="flex flex-wrap gap-3">
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

            <a
              href={`/api/projects/${project.id}/iaa`}
              download
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              📈 Export IAA Excel
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
                <option key={user.id} value={user.id}>
                  {user.name || user.email} — {user.email}
                </option>
              ))}
            </select>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">
              Assign
            </button>
          </form>

          <div className="space-y-2">
            {project.assignments.length === 0 ? (
              <div className="text-sm text-gray-500">No annotators assigned.</div>
            ) : (
              project.assignments.map((assignment) => (
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
              ))
            )}
          </div>
        </div>

        <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Comparison Dashboard</h2>

          <div className="space-y-4">
            {project.tasks.map((task, i) => {
              const data = task.data as any;

              return (
                <div key={task.id} className="border border-[#2a2d3e] rounded-lg p-4 bg-[#0e0f14]">
                  <div className="text-xs text-gray-500 mb-2">
                    Task {i + 1} {data.id ? `• ID: ${data.id}` : ""}
                  </div>

                  <div className="text-sm text-gray-300 mb-3">
                    {data.prompt || data.question || data.text || "—"}
                  </div>

                  <div className="space-y-2">
                    {task.annotations.length === 0 ? (
                      <div className="text-xs text-gray-600">No annotations yet.</div>
                    ) : (
                      task.annotations.map((ann) => {
                        const r = ann.result as any;

                        return (
                          <div
                            key={ann.id}
                            className="text-xs border border-[#2a2d3e] rounded-md px-3 py-2 grid grid-cols-1 md:grid-cols-4 gap-2"
                          >
                            <span className="text-gray-400">
                              {ann.user?.name || ann.user?.email || "Unknown"}
                            </span>
                            <span className="text-gray-300">
                              Evaluation: {r?.rating || "—"}
                            </span>
                            <span className="text-gray-300">
                              Severity: {r?.severity || "—"}
                            </span>
                            <span className="text-gray-500 truncate">
                              Notes: {ann.notes || "—"}
                            </span>
                          </div>
                        );
                      })
                    )}
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
