"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (input !== "DELETE") {
      alert("Type DELETE to confirm");
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Failed to delete project");
      setDeleting(false);
      setConfirming(false);
      setInput("");
    }
  };

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs text-red-400">
          Type <b>DELETE</b> to confirm deletion
        </span>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE"
          className="text-xs px-2 py-1 bg-[#0e0f14] border border-[#2a2d3e] rounded text-white outline-none"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg"
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>

          <button
            onClick={() => {
              setConfirming(false);
              setInput("");
            }}
            className="text-xs px-3 py-1.5 bg-[#1a1d27] border border-[#2a2d3e] text-gray-400 hover:text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-4 py-2 border border-red-900/60 text-red-500 hover:bg-red-900/20 hover:border-red-700 rounded-lg"
    >
      Delete Project
    </button>
  );
}
