// src/app/organizations/[organizationId]/new-project/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectType } from "@/types";
import { getProjectTypeLabel, getProjectTypeIcon } from "@/lib/utils";

type ProjectTypeWithPreference = ProjectType | "pairwise_review";

const PROJECT_TYPES: ProjectTypeWithPreference[] = [
  "text_classification",
  "ner",
  "image_classification",
  "bounding_box",
  "audio_transcription",
  "qa_review",
  "safety",
  "pairwise_review",
  "freeform",
];

const DEFAULT_CONFIGS: Record<ProjectTypeWithPreference, object> = {
  text_classification: {
    labels: [
      { value: "positive", color: "#22c55e", hotkey: "1" },
      { value: "negative", color: "#ef4444", hotkey: "2" },
      { value: "neutral", color: "#f59e0b", hotkey: "3" },
    ],
    allow_multiple: false,
    instructions: "Select the label that best fits the text.",
  },
  ner: {
    labels: [
      { value: "PERSON", color: "#3b82f6", hotkey: "1" },
      { value: "ORG", color: "#f59e0b", hotkey: "2" },
      { value: "LOCATION", color: "#22c55e", hotkey: "3" },
    ],
    instructions: "Select text spans and assign an entity label.",
  },
  image_classification: {
    labels: [
      { value: "cat", color: "#f59e0b", hotkey: "1" },
      { value: "dog", color: "#3b82f6", hotkey: "2" },
      { value: "other", color: "#8b5cf6", hotkey: "3" },
    ],
    allow_multiple: false,
    instructions: "Select the label that best describes the image.",
  },
  bounding_box: {
    labels: [
      { value: "object", color: "#ef4444", hotkey: "1" },
      { value: "person", color: "#3b82f6", hotkey: "2" },
    ],
    instructions: "Draw bounding boxes around objects.",
  },
  audio_transcription: {
    instructions: "Listen and transcribe the audio. Mark unclear parts with [unclear].",
    show_timestamps: false,
    languages: ["English"],
  },
  qa_review: {
    rating_labels: [
      { value: "correct", color: "#22c55e", hotkey: "1" },
      { value: "partial", color: "#f59e0b", hotkey: "2" },
      { value: "incorrect", color: "#ef4444", hotkey: "3" },
    ],
    require_correction: false,
    instructions: "Rate the AI-generated answer.",
  },
  safety: {
    rating_labels: [
      { value: "Safe", hotkey: "1" },
      { value: "Not Safe", hotkey: "2" },
      { value: "tool_call", hotkey: "3" },
    ],
    severity_labels: [{ value: "Low" }, { value: "Medium" }, { value: "Critical" }],
    require_correction: false,
    instructions: "Review the answer for safety.",
  },
  pairwise_review: {
    rating_labels: [
      { value: "A is better than B", color: "#22c55e", hotkey: "1" },
      { value: "B is better than A", color: "#14b8a6", hotkey: "2" },
      { value: "Both are equal", color: "#f59e0b", hotkey: "3" },
      { value: "Need expert", color: "#8b5cf6", hotkey: "4" },
      { value: "Prompt has issue", color: "#ef4444", hotkey: "5" },
    ],
    instructions: "Compare Response A and Response B, then choose the best preference.",
  },
  freeform: {
    instructions: "Review the content and write your notes.",
    min_length: 0,
    tags: ["good", "unclear", "needs-review"],
  },
};

function projectTypeIcon(type: ProjectTypeWithPreference) {
  if (type === "pairwise_review") return "💎";
  return getProjectTypeIcon(type as ProjectType);
}

function projectTypeLabel(type: ProjectTypeWithPreference) {
  if (type === "pairwise_review") return "Preference";
  return getProjectTypeLabel(type as ProjectType);
}

export default function NewProjectPage({
  params,
}: {
  params: { organizationId: string };
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [type, setType] = useState<ProjectTypeWithPreference>("safety");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priority: priority || null,
          type,
          config: DEFAULT_CONFIGS[type],
          organizationId: params.organizationId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");

      const project = await res.json();
      router.push(`/projects/${project.id}/import`);
    } catch {
      setError("Failed to create project. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0f14]">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href={`/organizations/${params.organizationId}`}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Organization
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-white">New Project</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Create New Project</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Preference"
              className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-emerald-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-emerald-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority <span className="text-gray-600">(optional)</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-emerald-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors"
            >
              <option value="">No priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Annotation Type *
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                    type === t
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-[#2a2d3e] bg-[#13151e] text-gray-400 hover:border-emerald-500/50 hover:text-white"
                  }`}
                >
                  <span>{projectTypeIcon(t)}</span>
                  <span className="truncate">{projectTypeLabel(t)}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-all"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>

            <Link
              href={`/organizations/${params.organizationId}`}
              className="bg-[#1a1d27] hover:bg-[#21253a] text-gray-300 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
