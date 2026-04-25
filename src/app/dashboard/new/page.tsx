// src/app/dashboard/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectType } from "@/types";
import { getProjectTypeLabel, getProjectTypeIcon } from "@/lib/utils";

const PROJECT_TYPES: ProjectType[] = [
  "text_classification",
  "ner",
  "image_classification",
  "bounding_box",
  "audio_transcription",
  "qa_review",
  "freeform",
];

const DEFAULT_CONFIGS: Record<ProjectType, object> = {
  text_classification: {
    labels: [
      { value: "positive", color: "#22c55e", hotkey: "1" },
      { value: "negative", color: "#ef4444", hotkey: "2" },
      { value: "neutral",  color: "#f59e0b", hotkey: "3" },
    ],
    allow_multiple: false,
    instructions: "Select the label that best fits the text.",
  },
  ner: {
    labels: [
      { value: "PERSON",   color: "#3b82f6", hotkey: "1" },
      { value: "ORG",      color: "#f59e0b", hotkey: "2" },
      { value: "LOCATION", color: "#22c55e", hotkey: "3" },
    ],
    instructions: "Select text spans and assign an entity label.",
  },
  image_classification: {
    labels: [
      { value: "cat",  color: "#f59e0b", hotkey: "1" },
      { value: "dog",  color: "#3b82f6", hotkey: "2" },
      { value: "other",color: "#8b5cf6", hotkey: "3" },
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
      { value: "correct",   color: "#22c55e", hotkey: "1" },
      { value: "partial",   color: "#f59e0b", hotkey: "2" },
      { value: "incorrect", color: "#ef4444", hotkey: "3" },
    ],
    require_correction: false,
    instructions: "Rate the AI-generated answer.",
  },
  freeform: {
    instructions: "Review the content and write your notes.",
    min_length: 0,
    tags: ["good", "unclear", "needs-review"],
  },
};

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("text_classification");
  const [configJson, setConfigJson] = useState(JSON.stringify(DEFAULT_CONFIGS["text_classification"], null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeChange = (t: ProjectType) => {
    setType(t);
    setConfigJson(JSON.stringify(DEFAULT_CONFIGS[t], null, 2));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Project name is required"); return; }
    let config;
    try {
      config = JSON.parse(configJson);
    } catch {
      setError("Invalid JSON in config");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type, config }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (e) {
      setError("Failed to create project. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0f14]">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm">← Projects</Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-white">New Project</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Create New Project</h1>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sentiment Analysis Dataset"
              className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Annotation Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
                    type === t
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-[#2a2d3e] bg-[#13151e] text-gray-400 hover:border-[#3a3d4e] hover:text-white"
                  }`}
                >
                  <span>{getProjectTypeIcon(t)}</span>
                  <span className="truncate">{getProjectTypeLabel(t)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Config JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Config JSON
              <span className="text-gray-600 font-normal ml-2">(auto-filled based on type)</span>
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full bg-[#0a0b10] border border-[#2a2d3e] focus:border-indigo-500 rounded-lg px-4 py-3 text-green-400 text-xs font-mono outline-none transition-colors resize-y"
            />
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
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
            <Link
              href="/dashboard"
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
