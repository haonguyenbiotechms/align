export default function InstructionsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Instructions</h1>
      <p className="text-sm text-gray-600 mb-2">How to get the most out of Align.</p>
      <p className="text-xs mb-8">
        <a
          href="https://github.com/haonguyenbiotechms/align"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 font-medium"
        >
          ↗ Project &amp; source code on GitHub
        </a>
      </p>

      {/* Setup */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          One-time setup — connect an AI provider
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Align doesn&apos;t come with an AI &mdash; you point it at a provider and give it a key.
          This hosted version runs entirely in your browser: the key is saved{' '}
          <strong>only in this browser</strong> and sent <strong>straight from here to the provider
          you choose</strong>, never through a server we run. Open <strong>Settings</strong> in the
          sidebar and pick one of the paths below.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          <strong>Gemini, Ollama, Groq and OpenRouter</strong> allow browser use with no caveats.{' '}
          <strong>OpenAI and Anthropic</strong> label direct-from-browser use as &ldquo;not
          recommended&rdquo; &mdash; for a solo user with their own key the practical risk is small
          (details in the notice you saw on first visit). If you&apos;d rather your key not sit in a
          browser at all, run the <strong>local version</strong> instead:{' '}
          <span className="font-mono">npm run dev</span> from the project code &mdash; see the{' '}
          <a
            href="https://github.com/haonguyenbiotechms/align"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 font-medium underline"
          >
            README on GitHub
          </a>
          .
        </p>

        <p className="text-sm font-medium text-gray-700 mb-2">
          The steps, in Settings:
        </p>
        <ol className="space-y-2.5 mb-5">
          {[
            { step: '1', text: 'Choose a Provider from the dropdown.' },
            { step: '2', text: 'Paste your API key (or, for a local model, fill in the Base URL instead).' },
            { step: '3', text: 'Leave Model on the default, or pick another from the dropdown — choose “Custom…” for a model that is not listed.' },
            { step: '4', text: 'Click Save, then Test connection. A green "Connected" message means you are ready.' },
            { step: '5', text: 'If the test fails, the message tells you what to fix (wrong key, wrong model name, provider unreachable).' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">{step}</span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>

        <p className="text-sm font-medium text-gray-700 mb-2">Which path is right for you?</p>
        <div className="space-y-3">
          <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Free, no account &mdash; Demo mode</p>
            <p className="text-xs text-gray-600 leading-relaxed mt-1">
              In Settings, tick <strong>Demo mode</strong> and Save. Every screen works with
              realistic sample results so you can explore the tool. It does not analyze your real
              resume &mdash; switch to a real provider when you want that.
            </p>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Free, real results &mdash; Google Gemini</p>
            <ol className="mt-1.5 space-y-1 text-xs text-gray-600 leading-relaxed list-decimal pl-4">
              <li>Go to <span className="font-mono">aistudio.google.com/apikey</span> and sign in with a Google account.</li>
              <li>Click <em>Create API key</em>. Copy the key (starts with <span className="font-mono">AIza…</span>). No credit card needed.</li>
              <li>In Settings: Provider = <strong>Google &mdash; Gemini</strong>, paste the key, Model = <span className="font-mono">gemini-3.6-flash</span>.</li>
              <li>Save &rarr; Test connection. The free tier is rate-limited but fine for personal use.</li>
            </ol>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Free &amp; private &mdash; a model on your own machine</p>
            <ol className="mt-1.5 space-y-1 text-xs text-gray-600 leading-relaxed list-decimal pl-4">
              <li>Install <span className="font-mono">Ollama</span> from <span className="font-mono">ollama.com</span> (Windows / Mac / Linux).</li>
              <li>Open a terminal and run <span className="font-mono">ollama pull llama3.1</span>, then <span className="font-mono">ollama serve</span> (it usually starts automatically).</li>
              <li>In Settings: Provider = <strong>OpenAI-compatible / Local</strong>, Base URL = <span className="font-mono">http://localhost:11434/v1</span>, leave the key blank, Model = <span className="font-mono">llama3.1</span>.</li>
              <li>Save &rarr; Test connection. Nothing leaves your computer. Needs a reasonably powerful machine.</li>
            </ol>
            <p className="text-xs text-gray-500 mt-1.5">
              Groq and OpenRouter also offer free API tiers &mdash; same &ldquo;OpenAI-compatible&rdquo;
              provider, using their <span className="font-mono">/v1</span> URL and a free key.
            </p>
          </div>

          <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Paid API &mdash; Anthropic (Claude) or OpenAI (GPT)</p>
            <ol className="mt-1.5 space-y-1 text-xs text-gray-600 leading-relaxed list-decimal pl-4">
              <li>Anthropic: <span className="font-mono">console.anthropic.com/settings/keys</span> &mdash; OpenAI: <span className="font-mono">platform.openai.com/api-keys</span>.</li>
              <li>Create an account, add a small amount of billing credit, and create a key.</li>
              <li>In Settings: pick the matching Provider, paste the key, keep the default Model, Save &rarr; Test.</li>
            </ol>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2 mt-2 leading-relaxed">
              A developer API key is <strong>not</strong> the same as a paid chat plan. ChatGPT Plus,
              Claude Pro and the Gemini app do not include API access &mdash; the API is billed
              separately, per use (usually cents per run at the default models).
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mt-4">
          You can change provider or key any time in Settings, and clear everything from this
          browser with &ldquo;Clear saved settings&rdquo; there.
        </p>
      </div>

      {/* Context */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Why Align exists</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The job market is getting harder — and it&apos;s not your fault. Large corporations are increasingly using
          AI to automate hiring decisions, cut headcount, and run applicants through automated screening systems
          (ATS) that reject resumes before any human ever sees them. New graduates are hit especially hard:
          years of hard work in school, and the door still feels closed.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Align was built for that reality. It gives you the same tools that hiring teams use — turned around to
          work <em>for</em>{' '}you. You deserve a fair shot, and we&apos;re here to help you get it.
        </p>
      </div>

      {/* Feature: Resume Analyzer */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="12" y2="17"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Resume Analyzer</h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Most companies pipe applications through ATS software that scores your resume against the job
          description before a recruiter ever reads it. If your resume doesn&apos;t use the right keywords and
          structure, it gets filtered out automatically — even if you&apos;re a great fit.
        </p>

        <p className="text-sm font-medium text-gray-700 mb-2">How to use it:</p>
        <ol className="space-y-2.5">
          {[
            { step: '1', text: 'Find a job posting you want to apply for. Copy the full job description.' },
            { step: '2', text: 'Upload your resume as a PDF or Word (.docx) file — or paste it as plain text if you prefer.' },
            { step: '3', text: 'Click Analyze & Optimize. Align will score how well your resume matches the job, highlight skill gaps with free learning resources, and generate an optimized version of your resume tailored to that specific role.' },
            { step: '4', text: 'Review the match score and skill gaps. If there are gaps marked "required", consider addressing them before applying.' },
            { step: '5', text: 'Download your optimized resume as a DOCX or PDF and submit it with your application.' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">{step}</span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Important:</strong> Only use the optimized resume as a starting point. Review every change —
            never include skills or experience you don&apos;t have. Align rewrites phrasing and structure to
            better align with the job description, but the facts should always be yours.
          </p>
        </div>
      </div>

      {/* Feature: Mock Interview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Mock Interview</h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Getting an interview is only half the battle. Interviews are a skill — and like any skill, you get
          better by practicing. Align generates realistic questions tailored to the specific role and gives
          you honest, constructive feedback on every answer so you can improve before the real thing.
        </p>

        <p className="text-sm font-medium text-gray-700 mb-2">How to use it:</p>
        <ol className="space-y-2.5">
          {[
            { step: '1', text: 'Paste the job description for the role you\'re preparing for.' },
            { step: '2', text: 'Optionally paste your resume — this lets Align ask questions specific to your background, like a real interviewer would.' },
            { step: '3', text: 'Click Start Interview. You\'ll receive 5 tailored questions mixing behavioral, technical, and situational types.' },
            { step: '4', text: 'Answer each question in your own words, just as you would in a real interview. Take your time.' },
            { step: '5', text: 'Click Get Feedback on each answer. Align will rate your response, highlight strengths, suggest improvements, and show you a rewritten example answer.' },
            { step: '6', text: 'Run the interview multiple times with different job descriptions to build broad confidence.' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">{step}</span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Feature: History */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900">History</h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Every Resume Analyzer and Mock Interview run is automatically saved to your History. You can revisit
          past results, compare how different resumes perform against different job descriptions, and track
          your interview progress over time. Use it to stay organized across multiple applications.
        </p>
      </div>

    </div>
  )
}
