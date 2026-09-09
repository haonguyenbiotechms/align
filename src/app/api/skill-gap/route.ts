import { z } from 'zod'
import { resolveConfig } from '@/lib/ai/config'
import { runObject } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

const MOCK_RESULT = {
  gaps: [
    {
      skill: 'Kubernetes',
      importance: 'required',
      jdEvidence: '"experience deploying and operating services on Kubernetes"',
      note: 'No container-orchestration experience shown. This is a core day-to-day requirement — worth a hands-on project before applying.',
    },
    {
      skill: 'Terraform / IaC',
      importance: 'required',
      jdEvidence: '"infrastructure as code (Terraform preferred)"',
      note: 'Your resume mentions manual cloud setup but no IaC tooling.',
    },
    {
      skill: 'gRPC',
      importance: 'preferred',
      jdEvidence: '"internal services communicate over gRPC"',
      note: 'Nice-to-have. REST experience transfers; a small demo would cover it.',
    },
  ],
  partialMatches: [
    { skill: 'CI/CD', note: 'You have GitHub Actions experience; the role uses GitLab CI — close, but name the difference in an interview.' },
  ],
  strengths: ['TypeScript', 'React', 'PostgreSQL', 'REST API design'],
}

const schema = z.object({
  gaps: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.enum(['required', 'preferred']),
        jdEvidence: z.string(),
        note: z.string(),
      }),
    )
    .max(8),
  partialMatches: z.array(z.object({ skill: z.string(), note: z.string() })).max(6),
  strengths: z.array(z.string()).max(10),
})

export async function POST(request: Request) {
  try {
    const { jobDescription, background, config } = await request.json()

    if (!jobDescription?.trim() || !background?.trim()) {
      return Response.json(
        { error: 'A job description and your background (resume or skills summary) are required.' },
        { status: 400 },
      )
    }

    if (config?.demo === true || process.env.MOCK_AI === 'true') {
      return Response.json(MOCK_RESULT)
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
      `Compare the candidate's background to the job description and identify the skill gaps.

Return:
- "gaps": up to 8 skills the job asks for that the background does NOT clearly show. Each:
  { "skill", "importance": "required" | "preferred",
    "jdEvidence": the exact phrase(s) in the job description that ask for it,
    "note": how significant the gap is and what would close it (1–2 sentences) }
- "partialMatches": skills where the candidate has something adjacent but not an exact match, each { "skill", "note" }
- "strengths": skills the job wants that the candidate clearly has (short list, names only)

Be specific and honest. Do not list a skill as a gap if the background shows it.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE BACKGROUND:
${background}`,
    )
    return Response.json(result)
  } catch (err) {
    console.error('[skill-gap]', err instanceof Error ? err.message : err)
    return Response.json({ error: friendlyAiError(err) }, { status: 502 })
  }
}
