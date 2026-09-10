'use client'

import { useEffect, useState } from 'react'
import { PROVIDERS, PROVIDER_META, DEFAULT_MODEL, type Provider } from '@/lib/ai/config'
import {
  loadSettings,
  saveSettings,
  clearSettings,
  type StoredSettings,
} from '@/lib/settings'
import { testConnection } from '@/lib/ai/client'

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  padding: '10px 14px',
  fontSize: 14,
  color: '#0f172a',
  outline: 'none',
  background: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
}

export default function SettingsPage() {
  const [s, setS] = useState<StoredSettings>({ provider: 'anthropic' })
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    const loaded = loadSettings()
    setS(Object.keys(loaded).length ? loaded : { provider: 'anthropic' })
  }, [])

  const provider = (s.provider ?? 'anthropic') as Provider
  const meta = PROVIDER_META[provider]

  function update(patch: Partial<StoredSettings>) {
    setS((prev) => ({ ...prev, ...patch }))
    setSaved(false)
    setTestResult(null)
  }

  function handleSave() {
    saveSettings(s)
    setSaved(true)
  }

  function handleClear() {
    if (!confirm('Remove the saved provider, API key, and model from this browser?')) return
    clearSettings()
    setS({ provider: 'anthropic' })
    setSaved(false)
    setTestResult(null)
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const data = await testConnection(s)
      setTestResult(
        data.ok
          ? { ok: true, msg: `Connected — ${data.model} responded.` }
          : { ok: false, msg: data.error || 'Test failed.' },
      )
    } catch (err) {
      setTestResult({ ok: false, msg: err instanceof Error ? err.message : 'Test failed.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Align calls the AI provider <em>you</em> choose, with <em>your</em> API key. The key is
        stored only in this browser and sent straight from here to that provider — it never passes
        through any server we run. See the note on the Instructions page about browser use.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
        {/* Provider */}
        <div>
          <label style={labelStyle}>Provider</label>
          <select
            style={inputStyle}
            value={provider}
            onChange={(e) => {
              const p = e.target.value as Provider
              update({ provider: p, model: DEFAULT_MODEL[p] })
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_META[p].label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1.5">{meta.blurb}</p>
          {meta.freeTier && (
            <p className="text-xs mt-1" style={{ color: '#059669' }}>
              ✓ {meta.freeTier}
            </p>
          )}
        </div>

        {/* API key (native providers) */}
        {provider !== 'openai-compatible' && (
          <div>
            <label style={labelStyle}>API key</label>
            <input
              type="password"
              style={inputStyle}
              placeholder="Paste your API key"
              value={s.apiKey ?? ''}
              onChange={(e) => update({ apiKey: e.target.value })}
              autoComplete="off"
            />
            {meta.keyUrl && (
              <p className="text-xs text-gray-500 mt-1.5">
                Get one at{' '}
                <a
                  href={meta.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#6366f1', fontWeight: 600 }}
                >
                  {meta.keyLabel}
                </a>
                . This is a developer API key, billed per use — not the same as a paid chat
                subscription.
              </p>
            )}
          </div>
        )}

        {/* Base URL (openai-compatible) */}
        {provider === 'openai-compatible' && (
          <>
            <div>
              <label style={labelStyle}>Base URL</label>
              <input
                style={inputStyle}
                placeholder="http://localhost:11434/v1"
                value={s.baseURL ?? ''}
                onChange={(e) => update({ baseURL: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Ollama: <code>http://localhost:11434/v1</code> · LM Studio:{' '}
                <code>http://localhost:1234/v1</code> · Groq / OpenRouter / Together: their{' '}
                <code>/v1</code> endpoint.
              </p>
            </div>
            <div>
              <label style={labelStyle}>API key (optional)</label>
              <input
                type="password"
                style={inputStyle}
                placeholder="Leave blank for a local model"
                value={s.apiKey ?? ''}
                onChange={(e) => update({ apiKey: e.target.value })}
                autoComplete="off"
              />
            </div>
          </>
        )}

        {/* Model */}
        <div>
          <label style={labelStyle}>Model</label>
          {provider === 'openai-compatible' ? (
            <input
              style={inputStyle}
              value={s.model ?? ''}
              onChange={(e) => update({ model: e.target.value })}
              placeholder={DEFAULT_MODEL[provider]}
            />
          ) : (
            <select
              style={inputStyle}
              value={s.model || DEFAULT_MODEL[provider]}
              onChange={(e) => update({ model: e.target.value })}
            >
              {meta.freeModels ? (
                <>
                  <optgroup label="Free tier — no card needed">
                    {meta.freeModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Paid">
                    {meta.models
                      .filter((m) => !meta.freeModels!.includes(m))
                      .map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                  </optgroup>
                </>
              ) : (
                meta.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))
              )}
              {s.model && !meta.models.includes(s.model) && (
                <option value={s.model}>{s.model} (custom)</option>
              )}
            </select>
          )}
        </div>

        {/* Demo mode */}
        <label className="flex items-center gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(s.demo)}
            onChange={(e) => update({ demo: e.target.checked })}
          />
          Demo mode — skip real API calls, return canned sample results (no key needed)
        </label>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleSave} className="btn-primary" style={{ padding: '9px 20px' }}>
            {saved ? 'Saved ✓' : 'Save'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || Boolean(s.demo)}
            className="btn-secondary"
            style={{ padding: '9px 20px' }}
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-red-500 transition ml-auto"
          >
            Clear saved settings
          </button>
        </div>

        {testResult && (
          <p
            className="text-sm"
            style={{ color: testResult.ok ? '#059669' : '#dc2626' }}
          >
            {testResult.ok ? '✓ ' : '✗ '}
            {testResult.msg}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800">No budget for an API key?</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Google Gemini</strong> has a genuine free tier — create a key at
            aistudio.google.com, pick <code>gemini-3.6-flash</code>.
          </li>
          <li>
            <strong>Groq</strong> and <strong>OpenRouter</strong> offer free API tiers — use the
            <em> OpenAI-compatible</em> provider with their base URL.
          </li>
          <li>
            <strong>Run a model locally</strong> with{' '}
            <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>
              Ollama
            </a>{' '}
            or LM Studio — zero cost, fully private, no key.
          </li>
          <li>
            <strong>Demo mode</strong> lets you click through every screen with sample data and no
            key at all.
          </li>
        </ul>
        <p className="pt-1">
          A free <em>chat</em> plan (ChatGPT Free/Plus, Claude Pro, Gemini app) does <strong>not</strong>{' '}
          include API access — the API is a separate, usage-billed product.
        </p>
      </div>
    </div>
  )
}
