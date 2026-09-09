'use client'

import { useEffect, useState } from 'react'
import { hasConsented, setConsented } from '@/lib/consent'
import { loadSettings, saveSettings } from '@/lib/settings'

export default function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [ok, setOk] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setOk(hasConsented())
    setReady(true)
  }, [])

  if (!ready) return null
  if (ok) return <>{children}</>

  function accept(demo: boolean) {
    if (demo) saveSettings({ ...loadSettings(), demo: true })
    setConsented()
    setOk(true)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/70 flex items-start justify-center p-4 sm:p-10">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-7">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Before you start</h2>
        <p className="text-sm text-gray-500 mb-5">
          This is the <strong>hosted web version</strong> of Align. Please read this once.
        </p>

        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            Align has <strong>no server and no account</strong>. Everything runs in this browser
            tab. Your API key and your history are saved only here (in this browser), and your key
            is sent <strong>straight from your browser to the AI provider you pick</strong> — it
            never passes through any server we run.
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900 mb-1.5">The one thing to know</p>
            <p className="text-amber-900">
              OpenAI and Anthropic label &ldquo;call us directly from a browser&rdquo; as{' '}
              <em>not recommended</em>. That warning is aimed at companies who would expose{' '}
              <em>one</em> key to <em>thousands</em> of users. Here, each person uses their{' '}
              <em>own</em> key that only <em>they</em> can see, so the practical risk is small.
            </p>
            <p className="text-amber-900 mt-2">
              The real risk in any browser tool: if malicious code ran on this page it could read
              your key. Align sanitizes AI output to block the known way that could happen, but you
              are trusting this site&apos;s code. Google Gemini, Ollama, Groq and OpenRouter allow
              browser use without any such warning.
            </p>
          </div>

          <p>
            Prefer not to? Use the <strong>local version</strong> instead: download the code and
            run <code className="bg-gray-100 px-1 rounded">npm run dev</code> on your own computer,
            where your key goes through a small server on your machine rather than the browser. See
            the project README for the 3-step setup.
          </p>

          <label className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>
              I understand how this works and I&apos;m comfortable using the hosted version with my
              own API key, at my own risk.
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="btn-primary"
            style={{ padding: '9px 20px', opacity: checked ? 1 : 0.5 }}
            disabled={!checked}
            onClick={() => accept(false)}
          >
            Continue
          </button>
          <button
            className="text-sm text-gray-500 hover:text-gray-800 transition"
            onClick={() => accept(true)}
          >
            Just exploring — use demo mode (no key)
          </button>
        </div>
      </div>
    </div>
  )
}
