# Align — hosted web version

**A private resume & interview toolkit that runs entirely in your browser.** No account, no
server, no database. You bring an API key for the AI provider of your choice (or use a free option,
a local model, or an offline demo). Your key and your history are saved only in your browser.

> This is the **`web` branch** — the version deployed to GitHub Pages. The **`main` branch** is the
> local version you run on your own computer with `npm run dev`; it routes AI calls through a small
> server on your machine instead of the browser. Pick whichever you prefer — see
> [Which version should I use?](#which-version-should-i-use).

Tools: **Resume Analyzer** (+ ATS-optimized rewrite, DOCX/PDF export) · **Skill Gap Finder** ·
**Mock Interview** · **History** (browser-local).

---

## Just use it

Open the hosted page (the URL is on the repository's GitHub Pages settings, typically
`https://<owner>.github.io/align/`). On first visit you'll see a short notice explaining how the
hosted version handles your key — read it, then either accept and add your key in **Settings**, or
choose demo mode.

Nothing to install. Everything happens in your tab.

---

## Connect an AI provider

Open **Settings** in the sidebar. The **Instructions** page has full detail; the short version:

| I want… | Do this |
|---|---|
| **To try it for free, right now** | Settings → tick **Demo mode** → Save. Sample results, no key. |
| **Free, with real results** | Free key at **<https://aistudio.google.com/apikey>** (no card). Provider **Google — Gemini**, model `gemini-2.0-flash`. |
| **Free & fully private** | Run **[Ollama](https://ollama.com)** locally (`ollama pull llama3.1`). Provider **OpenAI-compatible / Local**, Base URL `http://localhost:11434/v1`, no key, model `llama3.1`. |
| **Use Claude or GPT** | Key from **console.anthropic.com** or **platform.openai.com**. See the note below about browser use. |

### About browser use of OpenAI / Anthropic keys

This hosted version has no backend, so your browser calls the provider's API directly. **Google,
Ollama, Groq and OpenRouter** allow that with no caveats. **OpenAI and Anthropic** label
direct-from-browser calls as *"not recommended"* — that guidance targets companies who would
expose one shared key to thousands of users. For a single person using **their own** key that
only **they** can see, the practical risk is small. The real risk in any browser tool is
malicious code running on the page reading your key; Align sanitizes AI-generated HTML to block
the known way that could happen, but you are trusting this site's code and its dependencies.

If you'd rather your key never sit in a browser, use the **local version** (below).

---

## Which version should I use?

| | **Hosted (`web`)** | **Local (`main`)** |
|---|---|---|
| Setup | Open a URL | Install Node.js, `npm install`, `npm run dev` |
| Where AI calls go | Browser → provider directly | Browser → small server on your PC → provider |
| OpenAI / Anthropic | Work, behind the one-time notice | Work with no caveat |
| Gemini / Ollama / Groq / OpenRouter | Work | Work |
| Your data | Browser `localStorage` only | Browser `localStorage` only |
| Offline | No | Yes (with a local model) |

To run the local version: switch to the `main` branch and follow its README.

---

## Privacy

- No account, no sign-in, no analytics, no telemetry.
- API key and run history live in your browser (`localStorage`), scoped to this site. Not synced,
  not uploaded. Clear them any time: **Settings → Clear saved settings**, **History → Clear all
  history**, or your browser's "clear site data".
- The only network request Align makes is from your browser to the AI provider you configured.
- AI-generated resume HTML is sanitized (no scripts, event handlers, or non-`http(s)` links)
  before it is displayed or exported.

---

## Deploy your own copy (for forkers)

1. Fork the repo, keep the `web` branch.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `web` (or run the **Deploy to GitHub Pages** workflow manually). It runs `npm ci` +
   `npm run build` and publishes `out/` to `https://<you>.github.io/align/`.
4. If your repo name isn't `align`, change `repo` in `next.config.ts`.

---

## For developers

Next.js 16 (App Router, `output: 'export'`) · React 19 · TypeScript · Tailwind v4. AI access is
provider-neutral via the [Vercel AI SDK](https://sdk.vercel.dev) in `src/lib/ai/` — `client.ts`
runs the calls in the browser; `tasks.ts` holds the prompts/schemas shared with the `main` branch.
No `/api` routes on this branch.

```bash
npm run dev      # local dev (still browser-direct calls on this branch)
npm run build    # static export to out/
```

## Credits

Created by **haonguyenms**. Free to use, fork, and share.

## License

MIT — see [LICENSE](LICENSE).
