// src/components/annotators/QAReviewRenderer.tsx
"use client";

import { useEffect, useState } from "react";
import { QAReviewConfig, QAReviewResult, QATaskData } from "@/types";

interface Props {
  data: QATaskData;
  config: QAReviewConfig;
  result: QAReviewResult | null;
  onChange: (r: QAReviewResult) => void;
}

export function QAReviewRenderer({ data, config, result, onChange }: Props) {
  const taskData = data as any;

  const [rating, setRating] = useState(result?.rating ?? "");
  const [correction, setCorrection] = useState(result?.correction ?? "");

  const taskId = taskData.id ?? taskData.task_id ?? taskData.external_id ?? "-";
  const risk = taskData.risk_category ?? taskData.risk ?? "-";
  const language = taskData.language ?? taskData.lang ?? "-";

  const prompt = taskData.prompt ?? taskData.question ?? "";
  const answer = taskData.answer ?? taskData.ai_answer ?? "";

  useEffect(() => {
    if (result) {
      setRating(result.rating ?? "");
      setCorrection(result.correction ?? "");
    }
  }, [result]);

  const selectRating = (value: string) => {
    setRating(value);
    onChange({ rating: value, correction });
  };

  const handleCorrectionChange = (v: string) => {
    setCorrection(v);
    onChange({ rating, correction: v });
  };

  const getLabelColor = (value: string) =>
    config.rating_labels.find((l) => l.value === value)?.color ?? "#6366f1";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInField =
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInField) return;

      const number = Number(e.key);
      if (!Number.isNaN(number) && number >= 1 && number <= config.rating_labels.length) {
        e.preventDefault();
        selectRating(config.rating_labels[number - 1].value);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config.rating_labels, correction]);

  return (
    <div className="max-w-3xl mx-auto space-y-5 fade-in">
      {config.instructions && (
        <div className="text-xs text-gray-500 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-4 py-3">
          📋 {config.instructions}
        </div>
      )}

      <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-400 border-b border-[#2a2d3e] pb-3">
          <span><span className="text-gray-500">ID:</span> {taskId}</span>
          <span><span className="text-gray-500">Risk:</span> {risk}</span>
          <span><span className="text-gray-500">Language:</span> {language}</span>
        </div>

        <div>
          <div className="label-title">Prompt</div>
          <div className="task-text">{prompt}</div>
        </div>

        <div>
          <div className="label-title">Answer</div>
          <div className="task-text">{answer}</div>
        </div>
      </div>

      <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-5">
        <div className="evaluation-title">Evaluation</div>

        <div className="flex flex-wrap gap-2">
          {config.rating_labels.map((label, index) => {
            const isSelected = rating === label.value;
            const color = getLabelColor(label.value);

            return (
              <button
                key={label.value}
                onClick={() => selectRating(label.value)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor: isSelected ? color : "#2a2d3e",
                  backgroundColor: isSelected ? `${color}22` : "#13151e",
                  color: isSelected ? color : "#8b90a0",
                  boxShadow: isSelected ? `0 0 12px ${color}33` : "none",
                }}
              >
                {isSelected && <span>✓</span>}
                <kbd className="text-[10px] opacity-60 bg-black/30 px-1.5 py-0.5 rounded">
                  {index + 1}
                </kbd>
                <span>{label.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
          Notes / Correction
          {!config.require_correction && <span className="ml-1 text-gray-700">(optional)</span>}
        </label>
        <textarea
          value={correction}
          onChange={(e) => handleCorrectionChange(e.target.value)}
          placeholder="Write notes or correction here..."
          rows={4}
          className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-700 outline-none transition-colors resize-none"
        />
      </div>
    </div>
  );
}
