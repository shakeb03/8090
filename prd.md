**Mini Factory - Technical PRD**

---

**Overview**

A single-page demo app that takes a vague feature request and runs it through a 3-stage SDLC pipeline (PRD → Blueprint → Work Orders), streaming each stage sequentially. Built to demo to 8090.ai as a hiring artifact.

---

**Architecture**

- Frontend: Next.js 14, TypeScript, Tailwind CSS, deployed on Vercel
- Backend: FastAPI, Python, deployed on Railway
- LLM: Anthropic API (claude-sonnet-4-20250514), streaming via SSE
- Stateless. No DB. No auth.

---

**Backend**

Single FastAPI app.

One endpoint: `POST /generate`

Request body:
```json
{ "input": "string" }
```

Response: `text/event-stream` (SSE)

The endpoint runs three stages sequentially. Each stage calls the Anthropic API with streaming enabled. As tokens arrive, they are forwarded to the client via SSE.

SSE event format:
```
data: {"stage": "prd", "type": "token", "content": "..."}
data: {"stage": "prd", "type": "done"}
data: {"stage": "blueprint", "type": "token", "content": "..."}
data: {"stage": "blueprint", "type": "done"}
data: {"stage": "workorders", "type": "token", "content": "..."}
data: {"stage": "workorders", "type": "done"}
data: {"stage": "all", "type": "done"}
```

Stage prompts:

Stage 1 - PRD system prompt:
```
You are a senior product manager at a software company.

A team member has sent you a vague feature request. Your job is to turn it into a structured PRD.

Output a PRD with exactly these sections, in this order:
- Problem Statement (2-3 sentences, sharp and specific)
- Goals (3-5 bullet points)
- Non-Goals (2-3 bullet points, what this explicitly does NOT include)
- Constraints (technical or business constraints, 2-4 bullet points)
- Success Metrics (2-3 measurable outcomes)
- Open Questions (1-3 things that need answers before building)

Be direct. No fluff. No preamble. Start with "## Problem Statement".
```

Stage 2 - Blueprint system prompt:
```
You are a staff software engineer doing system design.

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

Be specific and technical. No fluff. Start immediately with the first Feature Node.
```

Stage 3 - Work Orders system prompt:
```
You are a tech lead breaking down engineering work into actionable tasks.

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

No fluff. Start immediately with WO-1.
```

Each stage passes the previous stage's full output as context to the next. Stage 2 receives the original input + PRD output. Stage 3 receives the original input + PRD output + Blueprint output.

CORS: allow the Vercel frontend domain. During local dev, allow localhost:3000.

Environment variable: `ANTHROPIC_API_KEY`

---

**Frontend**

Single page. No routing needed.

Layout: centered, max-width container, dark background.

Components needed:

1. Input area - textarea for the feature request, a "Run Factory" button. Disabled while a run is in progress.

2. Pipeline indicator - three stage pills (Refinery, Foundry, Planner) that show idle / active / complete state.

3. Three output panels, one per stage, stacked vertically. Each panel has a stage label and renders the streaming markdown content. Panels are empty until their stage begins. Markdown rendering required (headers, bullets).

State management: React useState. No external state library needed.

SSE consumption: native `fetch` with `ReadableStream`. Parse each `data:` line, JSON parse the payload, route by `stage` field.

Environment variable: `NEXT_PUBLIC_API_URL` pointing to the Railway backend URL.

During local dev, backend runs on `localhost:8000`.

---

**File Structure**

Backend:
```
backend/
  main.py
  requirements.txt
```

Frontend:
```
frontend/
  app/
    page.tsx
    layout.tsx
  components/
    InputPanel.tsx
    PipelineIndicator.tsx
    StagePanel.tsx
  lib/
    stream.ts
  .env.local
```

---

**Local Dev**

Backend: `uvicorn main:app --reload --port 8000`

Frontend: `npm run dev` on port 3000

---

**Deployment**

Backend: push to Railway, set `ANTHROPIC_API_KEY` env var, Railway auto-detects Python and serves via uvicorn.

Frontend: push to Vercel, set `NEXT_PUBLIC_API_URL` to the Railway service URL.

---

**Demo Input to use in Loom**

```
users are dropping off after signup, we need better onboarding I think
```

---

**Out of Scope**

- Auth
- DB
- Export / save
- Multiple concurrent runs
- Mobile optimization