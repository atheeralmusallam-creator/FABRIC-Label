"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Task, Project, Annotation, AnnotationResult } from "@/types";
import { TaskSidebar } from "./TaskSidebar";
import { AnnotationPanel } from "./AnnotationPanel";
import { RendererRouter } from "../annotators/RendererRouter";
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton";
import { EditProjectButton } from "@/components/ui/EditProjectButton"; // ✅ جديد

interface ProjectWithTasks extends Project {
  priority?: string | null;
  assignments?: {
    id: string;
    userId: string;
    user?: { id: string; name?: string | null; email: string };
  }[];
  tasks: (Task & { annotations: Annotation[] })[];
}

export function ProjectAnnotator({
  project,
}: {
  project: ProjectWithTasks;
  currentUserId?: string;
}) {
  const [tasks, setTasks] = useState(project.tasks);
  const [filter, setFilter] = useState("");

  const filteredTasks = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tasks;

    return tasks.filter((task) => {
      const data = task.data as any;
      const haystack = [
        data?.id,
        data?.prompt,
        data?.question,
        data?.answer,
        data?.response,
        data?.text,
        data?.risk,
        data?.risk_category,
        data?.language,
        data?.lang,
        task.status,
        ...(task.annotations || []).map((a: any) => a.user?.name || a.user?.email || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [tasks, filter]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstPending = project.tasks.findIndex(
      (t) => t.status !== "SKIPPED" && t.annotations?.[0]?.status !== "SUBMITTED"
    );
    return firstPending >= 0 ? firstPending : 0;
  });

  useEffect(() => {
    setCurrentIndex(0);
  }, [filter]);

  useEffect(() => {
    if (currentIndex > filteredTasks.length - 1) {
      setCurrentIndex(Math.max(filteredTasks.length - 1, 0));
    }
  }, [currentIndex, filteredTasks.length]);

  const [pendingResult, setPendingResult] = useState<AnnotationResult | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [submitError, setSubmitError] = useState("");

  const loadGuard = useRef<{ taskId: string | null; skipNextAutosave: boolean }>({
    taskId: null,
    skipNextAutosave: false,
  });

  const currentTask = filteredTasks[currentIndex];
  const currentAnnotation = currentTask?.annotations?.[0];

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, filteredTasks.length - 1));
  }, [filteredTasks.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInField =
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInField) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  return (
    <div className="flex flex-col h-screen bg-[#0e0f14] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2d3e] bg-[#13151e]">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={project.organizationId ? `/organizations/${project.organizationId}` : "/dashboard"}
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

        <div className="flex items-center gap-3">
          <a
            href={`/api/projects/${project.id}/iaa`}
            download
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
          >
            Export IAA
          </a>

          {/* ✅ زر التعديل */}
          <EditProjectButton
            projectId={project.id}
            initialName={project.name}
            initialDescription={project.description}
            initialPriority={project.priority}
          />

          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <TaskSidebar
          tasks={filteredTasks}
          currentIndex={currentIndex}
          onSelect={setCurrentIndex}
          filter={filter}
          onFilterChange={setFilter}
        />

        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a task
        </div>
      </div>
    </div>
  );
}
