import { z } from 'zod'
import { resolveConfig } from '@/lib/ai/config'
import { runObject } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

const MOCK_REVIEW = {
  changes: [
    "Reordered experience bullets to lead with cloud infrastructure work, matching the job's emphasis on AWS.",
    'Added quantified achievement: "reduced deployment time by 35%" derived from existing context.',
    'Replaced passive voice in 4 bullet points (e.g., "was responsible for" → "owned and delivered").',
    "Promoted TypeScript and React to the top of the skills section to align with the job's required stack.",
    'Tightened the summary from 5 sentences to 3, removing filler and centering it on the target role.',
  ],
}

const schema = z.object({ changes: z.array(z.string()).min(3).max(6) })

export async function POST(request: Request) {
  try {
    const { originalResume, optimizedResume, config } = await request.json()

    if (!originalResume?.trim() || !optimizedResume?.trim()) {
      return Response.json({ error: 'Both resumes are required.' }, { status: 400 })
    }

    if (config?.demo === true || process.env.MOCK_AI === 'true') {
      return Response.json(MOCK_REVIEW)
    }

    const cfg = resolveConfig(config)
    if (!cfg) {
      return Response.json(
        { error: 'No AI provider configured. Open Settings and add your API key.' },
        { status: 400 },
      )
    }

    const result = await runObject(
      cfg,
      schema,
      `Compare the original resume to the optimized resume. Return { "changes": [4–6 short strings] }, each explaining one specific change made (mention section names, skills, or phrases). No text outside the JSON.

ORIGINAL RESUME:
${originalResume}

OPTIMIZED RESUME:
${optimizedResume}`,
    )
    return Response.json(result)
  } catch (err) {
    console.error('[resume-review]', err instanceof Error ? err.message : err)
    return Response.json({ error: friendlyAiError(err) }, { status: 502 })
  }
}
