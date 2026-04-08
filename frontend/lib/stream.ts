export type Stage = "prd" | "blueprint" | "workorders";
export type StageStatus = "idle" | "active" | "complete";

interface SSEEvent {
  stage: Stage | "all";
  type: "token" | "done";
  content?: string;
}

export interface StreamCallbacks {
  onToken: (stage: Stage, content: string) => void;
  onStageDone: (stage: Stage) => void;
  onAllDone: () => void;
  onError: (err: Error) => void;
}

export async function runStream(
  apiUrl: string,
  input: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const response = await fetch(`${apiUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline to extract complete SSE events
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6);
      let event: SSEEvent;
      try {
        event = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      if (event.type === "token" && event.stage !== "all" && event.content) {
        callbacks.onToken(event.stage as Stage, event.content);
      } else if (event.type === "done" && event.stage !== "all") {
        callbacks.onStageDone(event.stage as Stage);
      } else if (event.stage === "all" && event.type === "done") {
        callbacks.onAllDone();
      }
    }
  }
}
