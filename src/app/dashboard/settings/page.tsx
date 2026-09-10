'use client'

import { useEffect, useState } from 'react'
import { PROVIDERS, PROVIDER_META, DEFAULT_MODEL, type Provider } from '@/lib/ai/config'
import {
  loadSettings,
  saveSettings,
  clearSettings,
  requestConfig,
  type StoredSettings,
} from '@/lib/settings'

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
  const [customOpen, setCustomOpen] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    const loaded = loadSettings()
    setS(Object.keys(loaded).length ? loaded : { provider: 'anthropic' })
  }, [])

  const provider = (s.provider ?? 'anthropic') as Provider
  const meta = PROVIDER_META[provider]
  const paidModels = meta.models.filter((m) => !(meta.freeModels ?? []).includes(m))
  const showCustom =
    customOpen || (!!s.model && meta.models.length > 0 && !meta.models.includes(s.model))

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
      const res = await fetch('/api/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: requestConfig(s) }),
      })
      const data = await res.json()
      setTestResult(
        data.ok
          ? { ok: true, msg: `Connected — ${data.model} replied "${data.sample}"` }
          : { ok: false, msg: data.error || 'Test failed.' },
      )
    } catch {
      setTestResult({ ok: false, msg: 'Could not reach the local server.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Align runs locally and calls the AI provider <em>you</em> choose, with <em>your</em> API
        key. The key is stored only in this browser and sent only to your local server, which
        forwards it to the provider. Nothing is uploaded anywhere else.
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
              setCustomOpen(false)
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
            <>
              <select
                style={inputStyle}
                value={showCustom ? '__custom__' : s.model || DEFAULT_MODEL[provider]}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__custom__') {
                    setCustomOpen(true)
                  } else {
                    setCustomOpen(false)
                    update({ model: v })
                  }
                }}
              >
                {meta.freeModels ? (
                  <>
                    <optgroup label="Free tier — no card needed">
                      {meta.freeModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </optgroup>
                    {paidModels.length > 0 && (
                      <optgroup label="Paid">
                        {paidModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </optgroup>
                    )}
                  </>
                ) : (
                  meta.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))
                )}
                <option value="__custom__">Custom / other model…</option>
              </select>
              {showCustom && (
                <input
                  style={{ ...inputStyle, marginTop: 8 }}
                  value={s.model ?? ''}
                  onChange={(e) => update({ model: e.target.value })}
                  placeholder="Exact model id from the provider"
                  autoFocus
                />
              )}
            </>
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
