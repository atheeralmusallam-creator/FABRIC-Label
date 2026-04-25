// src/components/layout/ProjectAnnotator.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Task, Project, Annotation, AnnotationResult } from "@/types";
import { getProjectTypeLabel, getProjectTypeIcon } from "@/lib/utils";
import { TaskSidebar } from "./TaskSidebar";
import { AnnotationPanel } from "./AnnotationPanel";
import { RendererRouter } from "../annotators/RendererRouter";

interface ProjectWithTasks extends Project {
  assignments?: { id: string; userId: string; user?: { id: string; name?: string | null; email: string } }[];
  tasks: (Task & { annotations: Annotation[] })[];
}

export function ProjectAnnotator({ project }: { project: ProjectWithTasks; currentUserId?: string }) {
  const [tasks, setTasks] = useState(project.tasks);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstPending = project.tasks.findIndex((t) => t.status !== "SKIPPED" && t.annotations?.[0]?.status !== "SUBMITTED");
    return firstPending >= 0 ? firstPending : 0;
  });
  const [pendingResult, setPendingResult] = useState<AnnotationResult | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const loadGuard = useRef<{ taskId: string | null; skipNextAutosave: boolean }>({ taskId: null, skipNextAutosave: false });

  const currentTask = tasks[currentIndex];
  const currentAnnotation = currentTask?.annotations?.[0];

  useEffect(() => {
    setPendingResult(null);
    setNotes("");
    setDraftState("idle");
    if (currentTask?.annotations?.[0]) {
      const ann = currentTask.annotations[0];
      setPendingResult(ann.result as AnnotationResult);
      setNotes(ann.notes ?? "");
      setDraftState(ann.status === "DRAFT" ? "saved" : "idle");
    }
    loadGuard.current = { taskId: currentTask?.id ?? null, skipNextAutosave: true };
  }, [currentIndex, currentTask?.id]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, tasks.length - 1));
  }, [tasks.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const saveDraft = useCallback(async () => {
    if (!pendingResult || !currentTask || currentTask.status === "SUBMITTED") return;
    setDraftState("saving");
    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: currentTask.id, result: pendingResult, notes, status: "DRAFT" }),
      });
      if (!res.ok) throw new Error();
      const ann = await res.json();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === currentTask.id
            ? { ...t, annotations: [ann] }
            : t
        )
      );
      setDraftState("saved");
    } catch {
      setDraftState("error");
    }
  }, [pendingResult, currentTask, notes]);

  useEffect(() => {
    if (!currentTask || !pendingResult || currentTask.status === "SUBMITTED") return;

    if (loadGuard.current.taskId === currentTask.id && loadGuard.current.skipNextAutosave) {
      loadGuard.current.skipNextAutosave = false;
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [pendingResult, notes, currentTask?.id, currentTask?.status, saveDraft]);

  const handleSubmit = useCallback(async () => {
    if (!pendingResult || !currentTask) return;
    setSaving(true);
    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: currentTask.id, result: pendingResult, notes, status: "SUBMITTED" }),
      });
      if (!res.ok) throw new Error();
      const ann = await res.json();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === currentTask.id
            ? { ...t, annotations: [ann] }
            : t
        )
      );
      setDraftState("idle");
      showToast("Submitted ✓");
      setTimeout(() => goNext(), 300);
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, [pendingResult, currentTask, notes, goNext]);

  const handleSkip = useCallback(async () => {
    if (!currentTask) return;
    try {
      await fetch(`/api/tasks/${currentTask.id}/skip`, { method: "POST" });
      setTasks((prev) =>
        prev.map((t) => (t.id === currentTask.id ? { ...t, status: "SKIPPED" } : t))
      );
      showToast("Skipped");
      setTimeout(() => goNext(), 300);
    } catch {
      showToast("Failed to skip", "error");
    }
  }, [currentTask, goNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInField = tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;

      if (isInField) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, goNext, goPrev]);

  const stats = {
    total: tasks.length,
    submitted: tasks.filter((t) => t.annotations?.[0]?.status === "SUBMITTED" || t.status === "SUBMITTED").length,
    skipped: tasks.filter((t) => t.status === "SKIPPED").length,
  };
  const progress = stats.total > 0 ? Math.round(((stats.submitted + stats.skipped) / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-[#0e0f14] overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#13151e] border-b border-[#2a2d3e] z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={project.organizationId ? `/organizations/${project.organizationId}` : "/dashboard"} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-sm">{getProjectTypeIcon(project.type as any)}</span>
          <h1 className="text-sm font-semibold text-white truncate">{project.name}</h1>
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-[#1a1d27] text-gray-500 border border-[#2a2d3e]">
            {getProjectTypeLabel(project.type as any)}
          </span>
          <Link href={`/projects/${project.id}/settings`} className="hidden sm:inline text-xs text-gray-600 hover:text-gray-400 transition-colors" title="Settings">⚙️</Link>
          <Link href={`/projects/${project.id}/import`} className="hidden sm:inline text-xs text-gray-600 hover:text-gray-400 transition-colors" title="Import tasks">⬆️ Import</Link>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="text-green-500 font-medium">{stats.submitted}</span>
            <span>/</span>
            <span>{stats.total}</span>
            <div className="w-20 h-1.5 bg-[#2a2d3e] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>
          <div className="text-xs text-gray-600 hidden md:block">
            <kbd className="bg-[#1a1d27] border border-[#2a2d3e] px-1.5 py-0.5 rounded text-gray-500">←</kbd>
            {" "}<kbd className="bg-[#1a1d27] border border-[#2a2d3e] px-1.5 py-0.5 rounded text-gray-500">→</kbd>
            {" "}<kbd className="bg-[#1a1d27] border border-[#2a2d3e] px-1.5 py-0.5 rounded text-gray-500">Enter</kbd>
          </div>
          <div className="relative group hidden sm:block">
            <button className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1d27] border border-[#2a2d3e] text-gray-500 hover:text-white transition-colors">Export ↓</button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
              <a href={`/api/projects/${project.id}/export?format=json`} download className="block px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#21253a] rounded-t-lg transition-colors">📄 JSON</a>
              <a href={`/api/projects/${project.id}/export?format=csv`} download className="block px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#21253a] rounded-b-lg transition-colors">📊 CSV</a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <TaskSidebar tasks={tasks} currentIndex={currentIndex} onSelect={setCurrentIndex} filter={filter} onFilterChange={setFilter} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentTask ? (
            <>
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#2a2d3e] bg-[#13151e]">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Task {currentIndex + 1} of {tasks.length}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    currentAnnotation?.status === "SUBMITTED" || currentTask.status === "SUBMITTED" ? "status-submitted" :
                    currentTask.status === "SKIPPED"   ? "status-skipped" :
                    currentAnnotation?.status === "DRAFT" ? "bg-blue-900/40 text-blue-400 border border-blue-700/50" :
                    "status-pending"
                  }`}>
                    {currentAnnotation?.status === "SUBMITTED" ? "submitted" : currentTask.status === "PENDING" && currentAnnotation?.status === "DRAFT" ? "draft" : currentTask.status.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goPrev} disabled={currentIndex === 0} className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1d27] border border-[#2a2d3e] text-gray-400 hover:text-white disabled:opacity-30 transition-colors">← Prev</button>
                  <button onClick={goNext} disabled={currentIndex === tasks.length - 1} className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1d27] border border-[#2a2d3e] text-gray-400 hover:text-white disabled:opacity-30 transition-colors">Next →</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <RendererRouter project={project as any} task={currentTask as any} result={pendingResult} onChange={setPendingResult} />
              </div>

              <AnnotationPanel
                notes={notes}
                onNotesChange={setNotes}
                onSubmit={handleSubmit}
                onSkip={handleSkip}
                saving={saving}
                draftState={draftState}
                canSubmit={!!pendingResult}
                taskStatus={currentTask.status}
                annotationStatus={currentAnnotation?.status as any}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600">No tasks in this project</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl z-50 fade-in ${
          toast.type === "success"
            ? "bg-green-900/80 border border-green-700/50 text-green-300"
            : "bg-red-900/80 border border-red-700/50 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
