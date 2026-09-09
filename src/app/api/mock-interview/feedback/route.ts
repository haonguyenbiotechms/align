import { z } from 'zod'
import { resolveConfig } from '@/lib/ai/config'
import { runObject } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

const MOCK_FEEDBACK = {
  rating: 'Good',
  score: 7,
  strengths: ['Clear structure', 'Specific example provided'],
  improvements: ['Quantify the outcome with a metric', "Briefly mention what you'd do differently"],
  rewrite:
    'Strong answer overall. Consider adding a concrete result — e.g., "which reduced deploy time by 40%" — to make the impact more memorable.',
}

const schema = z.object({
  rating: z.enum(['Excellent', 'Good', 'Fair', 'Needs Work']),
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()).min(1).max(2),
  improvements: z.array(z.string()).min(1).max(2),
  rewrite: z.string(),
})

export async function POST(request: Request) {
  try {
    const { question, answer, jobDescription, config } = await request.json()

    if (!question?.trim() || !answer?.trim()) {
      return Response.json({ error: 'Question and answer are required.' }, { status: 400 })
    }

    if (config?.demo === true || process.env.MOCK_AI === 'true') {
      return Response.json(MOCK_FEEDBACK)
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
      `You are an expert interviewer. Evaluate this interview answer.

Return:
- "rating": "Excellent" | "Good" | "Fair" | "Needs Work"
- "score": integer 1–10
- "strengths": 1–2 short strings
- "improvements": 1–2 short strings
- "rewrite": 1–2 sentence coaching tip on how to make the answer stronger

ROLE CONTEXT: ${jobDescription || 'Not provided'}

QUESTION: ${question}

CANDIDATE ANSWER: ${answer}`,
    )
    return Response.json(result)
  } catch (err) {
    console.error('[mock-interview/feedback]', err instanceof Error ? err.message : err)
    return Response.json({ error: friendlyAiError(err) }, { status: 502 })
  }
}
