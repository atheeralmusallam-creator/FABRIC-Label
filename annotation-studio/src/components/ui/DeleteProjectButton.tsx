// src/components/ui/DeleteProjectButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Failed to delete project");
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-red-400">Are you sure? This cannot be undone.</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {deleting ? "Deleting..." : "Yes, Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 bg-[#1a1d27] border border-[#2a2d3e] text-gray-400 hover:text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-4 py-2 border border-red-900/60 text-red-500 hover:bg-red-900/20 hover:border-red-700 rounded-lg transition-colors"
    >
      Delete Project
    </button>
  );
}
