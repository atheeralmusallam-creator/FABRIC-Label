"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Task, Project, Annotation, AnnotationResult } from "@/types";
import { TaskSidebar } from "./TaskSidebar";
import { AnnotationPanel } from "./AnnotationPanel";
import { RendererRouter } from "../annotators/RendererRouter";

interface ProjectWithTasks extends Project {
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
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstPending = project.tasks.findIndex(
      (t) => t.status !== "SKIPPED" && t.annotations?.[0]?.status !== "SUBMITTED"
    );
    return firstPending >= 0 ? firstPending : 0;
  });

  const [pendingResult, setPendingResult] = useState<AnnotationResult | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [submitError, setSubmitError] = useState("");

  const loadGuard = useRef<{ taskId: string | null; skipNextAutosave: boolean }>({
    taskId: null,
    skipNextAutosave: false,
  });

  const currentTask = tasks[currentIndex];
  const currentAnnotation = currentTask?.annotations?.[0];

  useEffect(() => {
    setPendingResult(null);
    setNotes("");
    setDraftState("idle");
    setSubmitError("");

    if (currentTask?.annotations?.[0]) {
      const ann = currentTask.annotations[0];
      setPendingResult(ann.result as AnnotationResult);
      setNotes(ann.notes ?? "");
      setDraftState(ann.status === "DRAFT" ? "saved" : "idle");
    }

    loadGuard.current = {
      taskId: currentTask?.id ?? null,
      skipNextAutosave: true,
    };
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
        body: JSON.stringify({
          taskId: currentTask.id,
          result: pendingResult,
          notes,
          status: "DRAFT",
        }),
      });

      if (!res.ok) throw new Error();

      const ann = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === currentTask.id ? { ...t, annotations: [ann] } : t))
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
    if (!currentTask) return;

    if (!(pendingResult as any)?.rating) {
      setSubmitError("evaluation is required");
      return;
    }

    setSubmitError("");
    setSaving(true);

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: currentTask.id,
          result: pendingResult,
          notes,
          status: "SUBMITTED",
        }),
      });

      if (!res.ok) throw new Error();

      const ann = await res.json();

      setTasks((prev) =>
        prev.map((t) => (t.id === currentTask.id ? { ...t, annotations: [ann] } : t))
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
      const isInField =
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInField) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, goNext, goPrev]);

  return (
    <div className="flex flex-col h-screen bg-[#0e0f14] overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#2a2d3e] bg-[#13151e] px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={project.organizationId ? `/organizations/${project.organizationId}` : "/dashboard"}
            className="text-gray-500 hover:text-white transition-colors"
          >
            Projects
          </Link>
          <span className="text-gray-700">/</span>
          <Link
            href={`/projects/${project.id}`}
            className="text-white font-semibold hover:text-indigo-300 transition-colors truncate"
          >
            {project.name}
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <TaskSidebar
          tasks={tasks}
          currentIndex={currentIndex}
          onSelect={setCurrentIndex}
          filter={filter}
          onFilterChange={setFilter}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentTask ? (
            <>
              <div className="flex-1 overflow-y-auto p-5">
                <RendererRouter
                  project={project as any}
                  task={currentTask as any}
                  result={pendingResult}
                  onChange={(result) => {
                    setPendingResult(result);
                    if ((result as any)?.rating) setSubmitError("");
                  }}
                />
              </div>

              {submitError && (
                <div className="mx-5 mb-2 bg-red-900/40 border border-red-700 text-red-400 text-sm px-4 py-2 rounded-lg">
                  <strong>Warning!</strong> {submitError}
                </div>
              )}

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
        <div
          className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl z-50 ${
            toast.type === "success"
              ? "bg-green-900/80 border border-green-700/50 text-green-300"
              : "bg-red-900/80 border border-red-700/50 text-red-300"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
