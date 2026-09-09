import { generateObject, generateText, streamText, type ModelMessage } from 'ai'
import type { z } from 'zod'
import type { AiConfig } from './config'
import { getModel } from './provider'

type Prompt = string | ModelMessage[]

function toMessages(prompt: Prompt): ModelMessage[] {
  return typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt
}

/**
 * Ask the model for a value matching `schema`. Uses native structured output
 * when the provider supports it; otherwise falls back to plain text + parse
 * with one repair retry (needed for many local / OpenAI-compatible models).
 */
export async function runObject<T>(
  cfg: AiConfig,
  schema: z.ZodType<T>,
  prompt: Prompt,
): Promise<T> {
  const model = getModel(cfg)
  const messages = toMessages(prompt)

  try {
    const { object } = await generateObject({
      model,
      schema,
      messages,
      temperature: cfg.temperature,
    })
    return object
  } catch {
    const { text } = await generateText({
      model,
      messages: [
        ...messages,
        {
          role: 'user',
          content:
            'Return ONLY valid minified JSON matching the requested shape. No prose, no code fences.',
        },
      ],
      temperature: cfg.temperature,
    })
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    return schema.parse(JSON.parse(cleaned))
  }
}

/** Stream plain text (used for the resume optimizer's live output). */
export function runStream(cfg: AiConfig, prompt: Prompt) {
  return streamText({
    model: getModel(cfg),
    messages: toMessages(prompt),
    temperature: cfg.temperature,
  })
}

/** One-shot plain text. */
export async function runText(cfg: AiConfig, prompt: Prompt): Promise<string> {
  const { text } = await generateText({
    model: getModel(cfg),
    messages: toMessages(prompt),
    temperature: cfg.temperature,
  })
  return text
}
