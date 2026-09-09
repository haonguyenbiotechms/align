# Align — Product Requirements

**Type:** Free, open-source, non-profit tool. No paid tiers, no data collection.
**Status:** Working. Actively maintained.

**Two builds of the same app:**
- **`main` — local version.** Runs on the user's machine (`npm run dev`). AI calls go through a
  small local server, so OpenAI/Anthropic keys are used without their "browser use" caveat.
- **`web` — hosted version (this branch).** Static export deployed to GitHub Pages; no server. AI
  calls go straight from the browser to the chosen provider. A one-time in-app notice explains
  the trade-off and lets the user accept it or switch to the local version. Gemini / Ollama /
  Groq / OpenRouter have no such caveat.

Both keep all data in the browser and share the same tools, prompts, and security model.

---

## 1. Purpose

Hiring is increasingly automated. Applicant Tracking Systems (ATS) rank or reject resumes on
keyword and formatting heuristics before a person reads them, and candidates rarely get feedback
on why. Commercial "resume AI" services address this but put the useful features behind a
subscription and route personal documents through someone else's servers.

**Align** gives job seekers those same capabilities as a tool they run themselves, for free:

- It runs on the user's own computer.
- It uses an AI provider the user chooses, with the user's own API key (or a free option, or a
  local model, or an offline demo).
- Nothing — resume text, job descriptions, API key, run history — is sent anywhere except the one
  request to the AI provider the user configured.

This is a public-interest project. There is no company behind it and no revenue model. Anyone may
use, copy, modify, and redistribute it (MIT license).

---

## 2. Principles

1. **Local first.** The whole app runs on `localhost`. There is no Align backend.
2. **Bring your own model.** No provider is privileged. Anthropic, OpenAI, Google, and any
   OpenAI-compatible endpoint (including a model running on the user's own machine) are equal
   options selected in Settings.
3. **Free is a first-class path.** A user with no money and no API key can still get real value
   (free provider tiers, a local model, or demo mode).
4. **The user's data is the user's.** Stored in their browser, never uploaded, never logged.
   Deletable and (planned) exportable at any time.
5. **Honest output.** The resume tools rewrite and reorder; they must not invent experience,
   employers, dates, or metrics. Every prompt enforces this and the UI reminds the user to review.
6. **Safe to run.** The tool must not be usable as an attack primitive against the user's machine
   or network, and rendered AI output must not be able to run code or exfiltrate the key.

---

## 3. Users

- Job seekers (students through mid-career) preparing applications.
- Career changers reframing existing experience.
- People who want an AI resume/interview assistant without a subscription or without handing
  their documents to a third-party web app.

Assumed skill level: comfortable installing a desktop application and copy-pasting a command.
The README targets someone with no coding background.

---

## 4. Architecture

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Runtime | Local Node.js process (`next dev` / `next start`), bound to localhost |
| AI access | [Vercel AI SDK](https://sdk.vercel.dev) — `src/lib/ai/` wraps `generateObject` / `generateText` behind a provider factory |
| Providers | `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/openai-compatible` |
| Persistence | Browser `localStorage` only — settings and run history. No database. |
| Auth | None. Single local user. |
| File parsing | Client-side: `mammoth` (DOCX), `pdfjs-dist` (PDF) |
| Export | Client-side: `html-docx-js` (DOCX), `jspdf` (PDF) |

**Why a local server at all** (instead of a pure browser app): browsers block direct calls to
most model APIs (CORS), and a server keeps the key out of the shipped JS bundle and enables
streaming. The server is the user's own machine.

**Config precedence:** in-app Settings (`localStorage`) → `.env.local` (`AI_PROVIDER`,
`AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`) → demo mode.

---

## 5. Features

All live under `/dashboard`. All save to local History. All honor demo mode.

### 5.1 Resume Analyzer
Input: a job description + a resume (PDF, DOCX, or pasted text). Output: a 0–100 match score with
verdict, matched skills, skill gaps (each marked required/preferred with 2–3 learning resources),
and a rewritten ATS-optimized resume downloadable as DOCX or PDF. The rewrite preserves all
original facts.

### 5.2 Skill Gap Finder
A lighter, faster check. Input: a job description + the user's background (a full resume *or* just
a short skills summary). Output: the key skills the role asks for that the user does not evidence,
each with the phrase in the job description that calls for it and a note on how significant the
gap is; plus adjacent/partial matches and a short list of strengths. No score, no rewrite — one
round-trip.

### 5.3 Mock Interview
Input: a job description (optionally a resume). Generates five role-specific questions
(behavioral / technical / situational). The user answers in the browser; each answer gets a
rating, a 1–10 score, strengths, improvements, and a model example answer.

### 5.4 History
Every run is stored in the browser with a timestamp. Filter by tool, expand to see full results,
delete individually. **Planned:** export/import the history as a JSON file.

### 5.5 Settings
Choose provider, paste API key (or set a base URL for a local/compatible endpoint), choose a
model, toggle demo mode, and run a "Test connection" check. Persisted to `localStorage`.

### 5.6 Instructions
In-app guide: the setup paths (demo / free Gemini / local Ollama / paid API), how each tool
works, and the "review every change, never claim experience you don't have" caveat.

---

## 6. Data & privacy model

| Data | Where it lives | Leaves the machine? |
|---|---|---|
| API key | `localStorage` (`align.ai-settings`) | Only inside the request the local server makes to the chosen provider. Never logged, never written to disk by Align. |
| Resume / job description text | In memory; part of a saved run in `localStorage` | Only in the prompt sent to the chosen provider. |
| Run history | `localStorage` (`align.history`) | No. |
| Anything else | — | There is no telemetry, analytics, error reporting, or "phone home". |

The provider the user picks has its own data policy for the prompt content it receives; that is
between the user and that provider and is called out in the docs.

---

## 7. Security model

Align is designed to run **only on `localhost`, for one local user**. Within that model:

| Risk | Mitigation |
|---|---|
| **Rendered AI output running code / stealing the key** — the optimized resume is HTML shown with `dangerouslySetInnerHTML` and fed to the exporters. A crafted job description could try to get the model to emit `<script>` / `<img onerror>` / `javascript:` links. | All model HTML is passed through DOMPurify (`src/lib/sanitizeHtml.ts`) restricted to formatting tags — no scripts, styles, event handlers, iframes, or non-`http(s)` URLs — before it is rendered, saved, or exported. Resource links are additionally validated to be `http(s)` (`src/lib/resourceUrl.ts`). |
| **Prompt injection via job description / resume** | Impact is bounded: the worst case is a low-quality or oddly-worded resume/answer, which the user reviews. Prompts explicitly forbid fabrication. Output sanitization (above) contains the dangerous cases. |
| **Server-Side Request Forgery via the OpenAI-compatible `baseURL`** | In the intended single-user local deployment this grants no privilege the user doesn't already have from their own shell. The docs state clearly that Align must not be exposed on a network or run as a shared service; if it were, the per-request `config` (arbitrary `baseURL` + key) would let any caller proxy through the host — which is why hosting it is explicitly unsupported. |
| **Key in `localStorage`** | Acceptable for a single-user local origin once script injection is removed (above). The alternative (`.env.local`) is documented for users who prefer a file. |
| **Untrusted `localStorage` / imported history** | History detail rendering re-sanitizes on read, so tampered or (future) imported data cannot inject either. |
| **Dependency / supply chain** | Lockfile committed; minimal dependency surface; no `postinstall` scripts of our own. |

**Non-negotiable in docs:** run on `localhost` only. Do not deploy Align as a website or a
shared/multi-user service.

Align contains no offensive capability, no network scanning, no credential handling beyond the
user's own model key, and no code execution of model output.

---

## 8. Non-goals

- No hosted version, no accounts, no sync across devices.
- No billing, no subscriptions, no "pro" features.
- No telemetry or analytics of any kind.
- Not an ATS emulator or a guarantee of interview outcomes — it is assistive.
- Not a general web app to be deployed for multiple users.

---

## 9. Roadmap

| Item | State |
|---|---|
| Resume Analyzer, Optimizer, Mock Interview, History | Done |
| Multi-provider (Anthropic / OpenAI / Google / OpenAI-compatible) + Settings | Done |
| Skill Gap Finder | Done |
| Output sanitization / URL validation | Done |
| History export / import as JSON | Planned |
| Swap `html-docx-js` (unmaintained) for a supported DOCX library | Planned |
| Optional one-click launcher / packaged desktop build | Considered |
| Native PDF passthrough for providers that accept it (currently text is extracted client-side) | Considered |
| More native providers (Mistral, Cohere, …) | Easy to add on request |

---

## 10. Contributing

Issues and pull requests welcome. Keep the principles in §2 intact — in particular: local-only,
provider-neutral, zero telemetry, and no feature that weakens §7. New providers should go through
`src/lib/ai/` and nowhere else.
