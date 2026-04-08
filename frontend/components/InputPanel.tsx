"use client";

import { useState } from "react";

interface InputPanelProps {
  onRun: (input: string) => void;
  isRunning: boolean;
}

export default function InputPanel({ onRun, isRunning }: InputPanelProps) {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isRunning}
        rows={4}
        placeholder="Describe a vague feature request... e.g. users are dropping off after signup, we need better onboarding I think"
        className="w-full rounded-lg bg-gray-900 border border-gray-700 p-4 text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      />
      <div className="flex justify-end">
        <button
          onClick={() => onRun(input)}
          disabled={isRunning || !input.trim()}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Running...
            </span>
          ) : (
            "Run Factory"
          )}
        </button>
      </div>
    </div>
  );
}
