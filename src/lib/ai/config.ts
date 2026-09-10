import { z } from 'zod'

export const PROVIDERS = ['anthropic', 'openai', 'google', 'openai-compatible'] as const
export type Provider = (typeof PROVIDERS)[number]

export const aiConfigSchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().trim().default(''),
  model: z.string().trim().min(1, 'Pick a model'),
  baseURL: z.string().trim().optional(),
  temperature: z.number().min(0).max(2).optional(),
  demo: z.boolean().optional(),
})
export type AiConfig = z.infer<typeof aiConfigSchema>

type ProviderMeta = {
  label: string
  blurb: string
  keyUrl: string
  keyLabel: string
  models: string[]
  /** Subset of `models` usable on the provider's free tier. */
  freeModels?: string[]
  needsBaseURL?: boolean
  freeTier?: string
}

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
  anthropic: {
    label: 'Anthropic — Claude',
    blurb: 'Pay-as-you-go API key. Separate from a Claude.ai Pro subscription.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyLabel: 'console.anthropic.com',
    models: ['claude-haiku-4-5', 'claude-sonnet-5', 'claude-opus-5'],
  },
  openai: {
    label: 'OpenAI — GPT',
    blurb: 'Pay-as-you-go API key. Separate from a ChatGPT Plus subscription.',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyLabel: 'platform.openai.com',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  },
  google: {
    label: 'Google — Gemini',
    blurb: 'Has a real free tier (rate-limited). Best option if you have no budget.',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyLabel: 'aistudio.google.com',
    // Naming follows Google's <version>-<tier> pattern; check aistudio.google.com
    // for exactly which are live. The Model field is free-text, so any works.
    models: [
      'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash',
      'gemini-3.8-pro', 'gemini-3.8-flash-lite',
      'gemini-3.7-pro', 'gemini-3.7-flash-lite',
      'gemini-3.6-pro', 'gemini-3.6-flash-lite',
    ],
    freeModels: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'],
    freeTier: 'Free tier: the Flash models (3.8 / 3.7 / 3.6) — no card required.',
  },
  'openai-compatible': {
    label: 'OpenAI-compatible / Local',
    blurb: 'Any endpoint that speaks the OpenAI API: Ollama, LM Studio, Groq, OpenRouter, Together, vLLM…',
    keyUrl: '',
    keyLabel: '',
    models: [],
    needsBaseURL: true,
    freeTier: 'Run a model on your own machine with Ollama or LM Studio — free, private, no key.',
  },
}

export const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: 'claude-haiku-4-5',
  openai: 'gpt-4o-mini',
  google: 'gemini-3.6-flash',
  'openai-compatible': 'llama3.1',
}

/**
 * Build the effective config for a request: the client-supplied config wins;
 * otherwise fall back to server env vars; otherwise null (caller should 400 or
 * fall back to demo data).
 */
export function resolveConfig(fromClient?: Partial<AiConfig> | null): AiConfig | null {
  if (fromClient?.provider) {
    const parsed = aiConfigSchema.safeParse({
      ...fromClient,
      model: fromClient.model || DEFAULT_MODEL[fromClient.provider as Provider],
    })
    return parsed.success ? parsed.data : null
  }

  const envProvider = (process.env.AI_PROVIDER ??
    (process.env.ANTHROPIC_API_KEY ? 'anthropic' : undefined)) as Provider | undefined
  if (!envProvider) return null

  const parsed = aiConfigSchema.safeParse({
    provider: envProvider,
    apiKey: process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.AI_MODEL || DEFAULT_MODEL[envProvider],
    baseURL: process.env.AI_BASE_URL,
    temperature: process.env.AI_TEMPERATURE ? Number(process.env.AI_TEMPERATURE) : undefined,
  })
  return parsed.success ? parsed.data : null
}
