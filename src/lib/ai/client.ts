'use client'

// Browser-side replacements for the `/api/*` routes used by the localhost
// (main-branch) version. Everything runs in the visitor's tab; the API key
// goes straight from here to the chosen provider.

import { resolveConfig, type AiConfig } from './config'
import { runObject, runText } from './run'
import { friendlyAiError } from './errors'
import {
  analyzeMessages, analyzeSchema, analyzeMock, type Analysis,
  optimizeMessages, optimizeMock,
  questionsPrompt, questionsSchema, questionsMock,
  feedbackPrompt, feedbackSchema, feedbackMock,
  skillGapPrompt, skillGapSchema, skillGapMock, type SkillGapResult,
  type ResumeContent,
} from './tasks'
import { requestConfig, loadSettings, type StoredSettings } from '@/lib/settings'

class NoProviderError extends Error {
  constructor() {
    super('No AI provider configured. Open Settings and add your API key (or turn on Demo mode).')
  }
}

function currentConfig(): { demo: boolean; cfg: AiConfig | null } {
  const s: StoredSettings = loadSettings()
  if (s.demo) return { demo: true, cfg: null }
  return { demo: false, cfg: resolveConfig(requestConfig(s)) }
}

async function guarded<T>(fn: (cfg: AiConfig) => Promise<T>, demoValue: T): Promise<T> {
  const { demo, cfg } = currentConfig()
  if (demo) return demoValue
  if (!cfg) throw new NoProviderError()
  try {
    return await fn(cfg)
  } catch (err) {
    throw new Error(friendlyAiError(err))
  }
}

export function analyzeResume(jobDescription: string, resume: ResumeContent): Promise<Analysis> {
  return guarded((cfg) => runObject(cfg, analyzeSchema, analyzeMessages(jobDescription, resume)), analyzeMock)
}

export async function optimizeResume(jobDescription: string, resume: ResumeContent): Promise<string> {
  return guarded(async (cfg) => {
    const raw = await runText(cfg, optimizeMessages(jobDescription, resume))
    return raw.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }, optimizeMock)
}

export function mockQuestions(jobDescription: string, resume?: string) {
  return guarded((cfg) => runObject(cfg, questionsSchema, questionsPrompt(jobDescription, resume)), questionsMock)
}

export function mockFeedback(question: string, answer: string, jobDescription?: string) {
  return guarded((cfg) => runObject(cfg, feedbackSchema, feedbackPrompt(question, answer, jobDescription)), feedbackMock)
}

export function findSkillGaps(jobDescription: string, background: string): Promise<SkillGapResult> {
  return guarded((cfg) => runObject(cfg, skillGapSchema, skillGapPrompt(jobDescription, background)), skillGapMock)
}

export async function testConnection(s: StoredSettings): Promise<{ ok: boolean; model?: string; error?: string }> {
  const cfg = resolveConfig(requestConfig(s))
  if (!cfg) return { ok: false, error: 'No provider configured.' }
  try {
    const text = await runText(cfg, 'Reply with the single word: ok')
    return { ok: true, model: cfg.model }
  } catch (err) {
    return { ok: false, error: friendlyAiError(err) }
  }
}
