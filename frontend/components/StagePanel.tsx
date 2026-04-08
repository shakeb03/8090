"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StageStatus } from "@/lib/stream";

interface StagePanelProps {
  label: string;
  content: string;
  status: StageStatus;
}

function borderColor(status: StageStatus) {
  if (status === "active") return "border-yellow-500/50";
  if (status === "complete") return "border-green-500/50";
  return "border-gray-800";
}

export default function StagePanel({ label, content, status }: StagePanelProps) {
  return (
    <div className={`rounded-xl border bg-gray-900 p-5 transition-colors duration-300 ${borderColor(status)}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        {status === "active" && (
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" />
          </span>
        )}
        {status === "complete" && (
          <span className="text-xs text-green-400">✓</span>
        )}
      </div>

      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300">
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        ) : (
          <p className="text-gray-600 italic m-0">Waiting...</p>
        )}
      </div>
    </div>
  );
}
