import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'
import type { AiConfig } from './config'

// This branch calls providers directly from the browser. Anthropic needs an
// explicit opt-in header to allow that; the other providers allow it already.
export function getModel(cfg: AiConfig): LanguageModel {
  switch (cfg.provider) {
    case 'anthropic':
      return createAnthropic({
        apiKey: cfg.apiKey,
        headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
      })(cfg.model)
    case 'openai':
      return createOpenAI({ apiKey: cfg.apiKey })(cfg.model)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: cfg.apiKey })(cfg.model)
    case 'openai-compatible':
      return createOpenAICompatible({
        name: 'custom',
        apiKey: cfg.apiKey || 'not-needed',
        baseURL: cfg.baseURL || 'http://localhost:11434/v1',
      })(cfg.model)
  }
}
