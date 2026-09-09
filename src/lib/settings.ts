'use client'

import { DEFAULT_MODEL, type AiConfig, type Provider } from '@/lib/ai/config'

const KEY = 'align.ai-settings'

export type StoredSettings = Partial<AiConfig>

export function loadSettings(): StoredSettings {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredSettings) : {}
  } catch {
    return {}
  }
}

export function saveSettings(s: StoredSettings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage disabled — nothing we can do
  }
}

export function clearSettings() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** True when the tool has enough to make a real API call. */
export function isConfigured(s: StoredSettings): boolean {
  if (s.demo) return true
  if (!s.provider) return false
  if (s.provider === 'openai-compatible') return Boolean(s.baseURL)
  return Boolean(s.apiKey)
}

/** The payload sent to API routes as `config`. */
export function requestConfig(s: StoredSettings): StoredSettings | undefined {
  if (!s.provider && !s.demo) return undefined
  if (s.demo) return { demo: true }
  return {
    provider: s.provider,
    apiKey: s.apiKey,
    model: s.model || (s.provider ? DEFAULT_MODEL[s.provider as Provider] : undefined),
    baseURL: s.baseURL,
    temperature: s.temperature,
  }
}
