"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditProjectButton({
  projectId,
  initialName,
  initialDescription,
  initialPriority,
}: {
  projectId: string;
  initialName: string;
  initialDescription?: string | null;
  initialPriority?: string | null;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [priority, setPriority] = useState(initialPriority ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      alert("Project name is required");
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        priority: priority || null,
      }),
    });

    if (!res.ok) {
      alert("Failed to update project");
      setSaving(false);
      return;
    }

    setOpen(false);
    setSaving(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-4 py-2 border border-[#2a2d3e] text-gray-400 hover:text-white hover:border-indigo-500/50 rounded-lg transition-colors"
      >
        Edit Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#13151e] border border-[#2a2d3e] rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Edit Project</h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Project Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0e0f14] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-[#0e0f14] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-[#0e0f14] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          >
            <option value="">No priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="text-sm px-4 py-2 rounded-lg bg-[#1a1d27] text-gray-300 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
