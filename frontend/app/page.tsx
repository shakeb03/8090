"use client";

import { useState } from "react";
import { runStream, type Stage, type StageStatus } from "@/lib/stream";
import InputPanel from "@/components/InputPanel";
import PipelineIndicator from "@/components/PipelineIndicator";
import StagePanel from "@/components/StagePanel";

const STAGES: { stage: Stage; label: string }[] = [
  { stage: "prd", label: "PRD" },
  { stage: "blueprint", label: "Blueprint" },
  { stage: "workorders", label: "Work Orders" },
];

const INITIAL_CONTENT: Record<Stage, string> = {
  prd: "",
  blueprint: "",
  workorders: "",
};

const INITIAL_STATUS: Record<Stage, StageStatus> = {
  prd: "idle",
  blueprint: "idle",
  workorders: "idle",
};

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [stageContent, setStageContent] = useState<Record<Stage, string>>(INITIAL_CONTENT);
  const [stageStatus, setStageStatus] = useState<Record<Stage, StageStatus>>(INITIAL_STATUS);

  const handleRun = async (input: string) => {
    setIsRunning(true);
    setStageContent({ ...INITIAL_CONTENT });
    setStageStatus({ ...INITIAL_STATUS });

    try {
      await runStream(process.env.NEXT_PUBLIC_API_URL!, input, {
        onToken: (stage, content) => {
          setStageStatus((prev) =>
            prev[stage] === "idle" ? { ...prev, [stage]: "active" } : prev
          );
          setStageContent((prev) => ({ ...prev, [stage]: prev[stage] + content }));
        },
        onStageDone: (stage) => {
          setStageStatus((prev) => ({ ...prev, [stage]: "complete" }));
        },
        onAllDone: () => {
          setIsRunning(false);
        },
        onError: (err) => {
          console.error(err);
          setIsRunning(false);
        },
      });
    } catch (err) {
      console.error(err);
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">
            Mini Factory
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            PRD → Blueprint → Work Orders
          </p>
        </div>

        <InputPanel onRun={handleRun} isRunning={isRunning} />

        <PipelineIndicator stageStatus={stageStatus} />

        <div className="flex flex-col gap-5">
          {STAGES.map(({ stage, label }) => (
            <StagePanel
              key={stage}
              label={label}
              content={stageContent[stage]}
              status={stageStatus[stage]}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
