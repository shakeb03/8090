"use client";

import type { Stage, StageStatus } from "@/lib/stream";

interface PipelineIndicatorProps {
  stageStatus: Record<Stage, StageStatus>;
}

const PILLS: { stage: Stage; label: string }[] = [
  { stage: "prd", label: "Refinery" },
  { stage: "blueprint", label: "Foundry" },
  { stage: "workorders", label: "Planner" },
];

function pillClasses(status: StageStatus) {
  if (status === "active")
    return "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400/60 animate-pulse";
  if (status === "complete")
    return "bg-green-500/20 text-green-400 ring-1 ring-green-500/60";
  return "bg-gray-800 text-gray-500";
}

export default function PipelineIndicator({ stageStatus }: PipelineIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {PILLS.map(({ stage, label }, i) => (
        <div key={stage} className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${pillClasses(stageStatus[stage])}`}
          >
            {label}
          </span>
          {i < PILLS.length - 1 && (
            <span className="text-gray-700 text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
