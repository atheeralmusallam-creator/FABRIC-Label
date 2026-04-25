export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProjectTypeLabel, getProjectTypeIcon, getProjectTypeColor } from "@/lib/utils";
import { ProjectType } from "@/types";
import { requireUser } from "@/lib/auth";
import { UserMenu } from "@/components/auth/UserMenu";

async function getProjects(user: { id: string; role: string }) {
  const projects = await prisma.project.findMany({
    where: user.role === "ANNOTATOR" ? { assignments: { some: { userId: user.id } } } : {},
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { status: true } } },
  });

  return projects.map((p) => {
    const total = p.tasks.length;
    const submitted = p.tasks.filter((t) => t.status === "SUBMITTED").length;
    const skipped = p.tasks.filter((t) => t.status === "SKIPPED").length;
    const progress = total > 0 ? Math.round(((submitted + skipped) / total) * 100) : 0;
    return { ...p, tasks: undefined, stats: { total, submitted, skipped, pending: total - submitted - skipped, progress } };
  });
}

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await getProjects(user);

  return (
    <div className="min-h-screen bg-[#0e0f14]">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">A</div>
            <span className="text-lg font-semibold text-white tracking-tight">Annotation Studio</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/dashboard" className="text-white font-medium">Projects</Link>
            {user.role === "ADMIN" && <Link href="/admin/users" className="hover:text-white transition-colors">Users</Link>}
            <a href="https://github.com" target="_blank" className="hover:text-white transition-colors">Docs</a>
            <UserMenu user={user} />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-500 text-sm mt-1">
              {projects.length} annotation project{projects.length !== 1 ? "s" : ""}
              {user.role === "ANNOTATOR" ? " assigned to you" : ""}
            </p>
          </div>
          {user.role !== "ANNOTATOR" && (
            <Link href="/dashboard/new" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <span>+</span> New Project
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#2a2d3e] rounded-xl">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-400 text-lg font-medium">No projects yet</p>
            <p className="text-gray-600 text-sm mt-2 mb-6">
              {user.role === "ANNOTATOR" ? "Ask a manager to assign a project to you." : "Create your first annotation project to get started."}
            </p>
            {user.role !== "ANNOTATOR" && (
              <Link href="/dashboard/new" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">Create Project</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block bg-[#13151e] border border-[#2a2d3e] hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:bg-[#1a1d27]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getProjectTypeIcon(project.type as ProjectType)}</span>
                    <div><h2 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{project.name}</h2></div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getProjectTypeColor(project.type as ProjectType)}`}>{getProjectTypeLabel(project.type as ProjectType)}</span>
                </div>
                {project.description && <p className="text-gray-500 text-xs mb-4 line-clamp-2">{project.description}</p>}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500"><span>{project.stats.total} tasks</span><span>{project.stats.progress}%</span></div>
                  <div className="h-1.5 bg-[#2a2d3e] rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${project.stats.progress}%` }} /></div>
                  <div className="flex gap-3 text-xs"><span className="text-green-500">{project.stats.submitted} done</span><span className="text-yellow-500">{project.stats.skipped} skipped</span><span className="text-gray-600">{project.stats.pending} pending</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
