// src/components/layout/TaskSidebar.tsx
"use client";

import { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  currentIndex: number;
  onSelect: (i: number) => void;
}

export function TaskSidebar({ tasks, currentIndex, onSelect }: Props) {
  const stats = {
    submitted: tasks.filter((t) => t.status === "SUBMITTED").length,
    skipped: tasks.filter((t) => t.status === "SKIPPED").length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-[#13151e] border-r border-[#2a2d3e] overflow-hidden">
      {/* Stats */}
      <div className="flex-shrink-0 px-3 py-3 border-b border-[#2a2d3e] grid grid-cols-3 gap-1 text-center">
        <div>
          <div className="text-green-400 text-sm font-bold">{stats.submitted}</div>
          <div className="text-gray-600 text-[10px] uppercase tracking-wide">Done</div>
        </div>
        <div>
          <div className="text-yellow-400 text-sm font-bold">{stats.skipped}</div>
          <div className="text-gray-600 text-[10px] uppercase tracking-wide">Skip</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm font-bold">{stats.pending}</div>
          <div className="text-gray-600 text-[10px] uppercase tracking-wide">Left</div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto py-1">
        {tasks.map((task, i) => (
          <button
            key={task.id}
            onClick={() => onSelect(i)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors group",
              i === currentIndex
                ? "bg-indigo-500/15 border-r-2 border-indigo-500"
                : "hover:bg-[#1a1d27] border-r-2 border-transparent"
            )}
          >
            {/* Status dot */}
            <span className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              task.status === "SUBMITTED" ? "bg-green-500" :
              task.status === "SKIPPED"   ? "bg-yellow-500" :
              "bg-gray-600"
            )} />

            {/* Task number + snippet */}
            <div className="min-w-0 flex-1">
              <div className={cn(
                "text-xs font-medium",
                i === currentIndex ? "text-white" : "text-gray-400 group-hover:text-white"
              )}>
                #{i + 1}
              </div>
              <div className="text-[10px] text-gray-600 truncate">
                {getTaskSnippet(task)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function getTaskSnippet(task: Task): string {
  const data = task.data as any;
  if (data.text) return data.text.slice(0, 40);
  if (data.caption) return data.caption;
  if (data.description) return data.description;
  if (data.question) return data.question.slice(0, 40);
  if (data.title) return data.title.slice(0, 40);
  return "Task";
}
