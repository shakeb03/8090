import json
import os

from anthropic import AsyncAnthropic
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

PRD_SYSTEM = """You are a senior product manager at a software company.

A team member has sent you a vague feature request. Your job is to turn it into a structured PRD.

Output a PRD with exactly these sections, in this order:
- Problem Statement (2-3 sentences, sharp and specific)
- Goals (3-5 bullet points)
- Non-Goals (2-3 bullet points, what this explicitly does NOT include)
- Constraints (technical or business constraints, 2-4 bullet points)
- Success Metrics (2-3 measurable outcomes)
- Open Questions (1-3 things that need answers before building)

Be direct. No fluff. No preamble. Start with "## Problem Statement"."""

BLUEPRINT_SYSTEM = """You are a staff software engineer doing system design.

You have been given a PRD. Your job is to produce a Blueprint - a structured feature hierarchy that translates the PRD into an engineering plan.

Output a Blueprint with:
- 3-5 top-level Feature Nodes (major functional areas)
- Under each Feature Node: 2-4 Sub-Features with a one-line description of what needs to be built
- Under each Sub-Feature: Implementation Notes (2-3 sentences on how to build it, what patterns to use, what to watch out for)

Format each Feature Node as:
## [Feature Node Name]
### [Sub-Feature Name]
Description: ...
Implementation Notes: ...

Be specific and technical. No fluff. Start immediately with the first Feature Node."""

WORKORDERS_SYSTEM = """You are a tech lead breaking down engineering work into actionable tasks.

You have been given a PRD and a Blueprint. Your job is to generate Work Orders - discrete, assignable units of engineering work.

Output 4-6 Work Orders. Each Work Order must include:
- Title (short, imperative)
- Priority: High / Medium / Low
- Estimated Effort: S / M / L (S = <1 day, M = 1-3 days, L = 3+ days)
- Files to Create or Modify (specific filenames and paths, infer a sensible Next.js + FastAPI project structure)
- Implementation Steps (3-5 numbered steps, specific enough that an engineer can start immediately)
- Acceptance Criteria (2-3 bullet points, testable)

Format each as:
## WO-[number]: [Title]

No fluff. Start immediately with WO-1."""


class GenerateRequest(BaseModel):
    input: str


async def event_stream(user_input: str):
    accumulated: dict[str, str] = {}

    stages = [
        {
            "id": "prd",
            "system": PRD_SYSTEM,
            "messages": [{"role": "user", "content": user_input}],
        },
        {
            "id": "blueprint",
            "system": BLUEPRINT_SYSTEM,
            "messages": [
                {
                    "role": "user",
                    "content": f"Original request:\n{user_input}\n\nPRD:\n{accumulated.get('prd', '')}",
                }
            ],
        },
        {
            "id": "workorders",
            "system": WORKORDERS_SYSTEM,
            "messages": [
                {
                    "role": "user",
                    "content": f"Original request:\n{user_input}\n\nPRD:\n{accumulated.get('prd', '')}\n\nBlueprint:\n{accumulated.get('blueprint', '')}",
                }
            ],
        },
    ]

    for stage in stages:
        stage_id = stage["id"]
        stage_text = ""

        # Rebuild messages with current accumulated context for stages 2 and 3
        if stage_id == "blueprint":
            messages = [
                {
                    "role": "user",
                    "content": f"Original request:\n{user_input}\n\nPRD:\n{accumulated['prd']}",
                }
            ]
        elif stage_id == "workorders":
            messages = [
                {
                    "role": "user",
                    "content": f"Original request:\n{user_input}\n\nPRD:\n{accumulated['prd']}\n\nBlueprint:\n{accumulated['blueprint']}",
                }
            ]
        else:
            messages = stage["messages"]

        async with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=stage["system"],
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                stage_text += text
                payload = json.dumps({"stage": stage_id, "type": "token", "content": text})
                yield f"data: {payload}\n\n"

        accumulated[stage_id] = stage_text
        yield f"data: {json.dumps({'stage': stage_id, 'type': 'done'})}\n\n"

    yield f"data: {json.dumps({'stage': 'all', 'type': 'done'})}\n\n"


@app.post("/generate")
async def generate(req: GenerateRequest):
    return StreamingResponse(
        event_stream(req.input),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

