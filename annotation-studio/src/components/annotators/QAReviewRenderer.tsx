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
  const [rating, setRating] = useState(result?.rating ?? "");
  const [correction, setCorrection] = useState(result?.correction ?? "");

  useEffect(() => {
    if (result) {
      setRating(result.rating ?? "");
      setCorrection(result.correction ?? "");
    }
  }, [result]);

  // Hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const label = config.rating_labels.find((l) => l.hotkey === e.key);
      if (label) selectRating(label.value);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config.rating_labels, correction]);

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 fade-in">
      {config.instructions && (
        <div className="text-xs text-gray-500 bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-4 py-3">
          📋 {config.instructions}
        </div>
      )}

      {/* Context */}
      {data.context && (
        <div className="text-xs text-gray-600 uppercase tracking-wide">
          Context: <span className="text-gray-500 normal-case">{data.context}</span>
        </div>
      )}

      {/* Question */}
      <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-5">
        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Question</p>
        <p className="text-base text-white font-medium">{data.question}</p>
      </div>

      {/* AI Answer */}
      <div className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-5">
        <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">AI Answer</p>
        <p className="text-sm text-gray-200 leading-relaxed">{data.ai_answer}</p>
      </div>

      {/* Rating */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Rate this answer</p>
        <div className="flex flex-wrap gap-2">
          {config.rating_labels.map((label) => {
            const isSelected = rating === label.value;
            return (
              <button
                key={label.value}
                onClick={() => selectRating(label.value)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor: isSelected ? label.color : "#2a2d3e",
                  backgroundColor: isSelected ? `${label.color}22` : "#13151e",
                  color: isSelected ? label.color : "#8b90a0",
                  boxShadow: isSelected ? `0 0 12px ${label.color}33` : "none",
                }}
              >
                {isSelected && <span>✓</span>}
                <span className="capitalize">{label.value}</span>
                {label.hotkey && (
                  <kbd className="text-[10px] opacity-50 bg-black/30 px-1 rounded">{label.hotkey}</kbd>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Correction */}
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
          Corrected Answer
          {!config.require_correction && <span className="ml-1 text-gray-700">(optional)</span>}
        </label>
        <textarea
          value={correction}
          onChange={(e) => handleCorrectionChange(e.target.value)}
          placeholder="Write the correct answer here if the AI answer is wrong or incomplete..."
          rows={4}
          className="w-full bg-[#13151e] border border-[#2a2d3e] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-700 outline-none transition-colors resize-none"
        />
      </div>
    </div>
  );
}
