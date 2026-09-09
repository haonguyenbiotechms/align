import { resolveConfig } from '@/lib/ai/config'
import { runText } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const cfg = resolveConfig(body?.config)

  if (!cfg) {
    return Response.json({ ok: false, error: 'No provider configured.' }, { status: 400 })
  }

  try {
    const text = await runText(cfg, 'Reply with the single word: ok')
    return Response.json({ ok: true, model: cfg.model, sample: text.trim().slice(0, 40) })
  } catch (err) {
    console.error('[ai-test]', err instanceof Error ? err.message : err)
    return Response.json({ ok: false, error: friendlyAiError(err) }, { status: 502 })
  }
}
