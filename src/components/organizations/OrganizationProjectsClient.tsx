"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProjectTypeColor, getProjectTypeIcon, getProjectTypeLabel } from "@/lib/utils";
import { ProjectType } from "@/types";
import { DeleteOrganizationButton } from "@/components/ui/DeleteOrganizationButton";
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton";
import { EditProjectButton } from "@/components/ui/EditProjectButton";

type ProjectCard = {
  id: string;
  name: string;
  description?: string | null;
  priority?: string | null;
  type: string;
  stats: {
    total: number;
    submitted: number;
    skipped: number;
    pending: number;
    progress: number;
    assignedTotal?: number;
    completedAssigned?: number;
    totalTasks?: number;
  };
};

type Props = {
  organization: { id: string; name: string; description?: string | null };
  projects: ProjectCard[];
  canManage: boolean;
};

export function OrganizationProjectsClient({ organization, projects, canManage }: Props) {
  const router = useRouter();

  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // 🔥 close menu on outside click
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const filteredProjects = projects.filter((project) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      project.name.toLowerCase().includes(q) ||
      project.type.toLowerCase().includes(q) ||
      (project.description || "").toLowerCase().includes(q) ||
      (project.priority || "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* header نفس كودك بدون تغيير */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const completedAssigned = project.stats.completedAssigned ?? project.stats.submitted;
          const assignedTotal = project.stats.assignedTotal ?? project.stats.total;
          const totalTasks = project.stats.totalTasks ?? project.stats.total;

          return (
            <div
              key={project.id}
              className={`relative group bg-[#13151e] border border-[#2a2d3e] hover:border-indigo-500/50 rounded-xl transition-all hover:bg-[#1a1d27] ${
                openMenuId === project.id ? "z-50" : "z-0"
              }`}
            >
              <Link href={`/projects/${project.id}`} className="block p-5">
                {/* نفس محتوى الكرت */}
              </Link>

              {canManage && (
                <div className="absolute top-4 right-4 z-[9999]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === project.id ? null : project.id);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#1a1d27] border border-[#2a2d3e] text-gray-400 hover:text-white hover:border-indigo-500/50"
                  >
                    ⋯
                  </button>

                  {openMenuId === project.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-44 bg-[#13151e] border border-[#2a2d3e] rounded-lg shadow-2xl overflow-hidden z-[9999]"
                    >
                      <div className="px-2 py-2">
                        <EditProjectButton
                          projectId={project.id}
                          initialName={project.name}
                          initialDescription={project.description}
                          initialPriority={project.priority}
                        />
                      </div>

                      <a
                        href={`/api/projects/${project.id}/iaa`}
                        download
                        className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#1a1d27] hover:text-white"
                      >
                        Export IAA
                      </a>

                      <DeleteProjectButton
                        projectId={project.id}
                        organizationId={organization.id}
                        variant="menu"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
