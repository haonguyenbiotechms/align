import { z } from 'zod'
import { resolveConfig } from '@/lib/ai/config'
import { runObject } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

const MOCK_QUESTIONS = {
  questions: [
    { id: 1, type: 'Behavioral', question: 'Tell me about a time you led a project under a tight deadline. What was your approach and outcome?' },
    { id: 2, type: 'Technical', question: 'How would you optimize a React application that is re-rendering too frequently?' },
    { id: 3, type: 'Situational', question: 'You discover a critical bug in production 30 minutes before a major demo. Walk me through what you do.' },
    { id: 4, type: 'Behavioral', question: "Describe a time you had to push back on a stakeholder's request. How did you handle it?" },
    { id: 5, type: 'Technical', question: 'Explain the difference between REST and GraphQL. When would you choose one over the other?' },
  ],
}

const schema = z.object({
  questions: z
    .array(
      z.object({
        id: z.number(),
        type: z.enum(['Behavioral', 'Technical', 'Situational']),
        question: z.string(),
      }),
    )
    .length(5),
})

export async function POST(request: Request) {
  try {
    const { jobDescription, resume, config } = await request.json()

    if (!jobDescription?.trim()) {
      return Response.json({ error: 'Job description is required.' }, { status: 400 })
    }

    if (config?.demo === true || process.env.MOCK_AI === 'true') {
      return Response.json(MOCK_QUESTIONS)
    }

    const cfg = resolveConfig(config)
    if (!cfg) {
      return Response.json(
        { error: 'No AI provider configured. Open Settings and add your API key.' },
        { status: 400 },
      )
    }

    const resumeContext = resume?.trim() ? `\n\nCANDIDATE RESUME:\n${resume}` : ''
    const result = await runObject(
      cfg,
      schema,
      `Generate exactly 5 interview questions for the following role. Mix behavioral, technical, and situational questions relevant to this specific job.${
        resumeContext ? " Tailor some questions to the candidate's background." : ''
      }
Each item: { "id": number, "type": "Behavioral" | "Technical" | "Situational", "question": string }

JOB DESCRIPTION:
${jobDescription}${resumeContext}`,
    )
    return Response.json(result)
  } catch (err) {
    console.error('[mock-interview/questions]', err instanceof Error ? err.message : err)
    return Response.json({ error: friendlyAiError(err) }, { status: 502 })
  }
}
