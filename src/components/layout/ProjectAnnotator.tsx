"use client";

import { useEffect } from "react";
import Link from "next/link";
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton";

export function ProjectAnnotator({
  project,
  children,
  handleSubmit,
  goNext,
  goPrev,
}: any) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit?.();
      }

      if (e.key === "ArrowRight") goNext?.();
      if (e.key === "ArrowLeft") goPrev?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, goNext, goPrev]);

  return (
    <div className="flex flex-col h-screen bg-[#0e0f14] overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2d3e] bg-[#13151e]">

        {/* LEFT: breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={
              project.organizationId
                ? `/organizations/${project.organizationId}`
                : "/dashboard"
            }
            className="text-gray-500 hover:text-white"
          >
            Projects
          </Link>

          <span className="text-gray-700">/</span>

          <Link
            href={`/projects/${project.id}`}
            className="text-white font-semibold hover:text-indigo-300"
          >
            {project.name}
          </Link>
        </div>

        {/* RIGHT: actions */}
        <div className="flex items-center gap-3">

          <a
            href={`/api/projects/${project.id}/iaa`}
            download
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
          >
            Export IAA
          </a>

          <DeleteProjectButton projectId={project.id} />

        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
