import { z } from 'zod'
import type { ModelMessage } from 'ai'
import { resolveConfig } from '@/lib/ai/config'
import { runObject } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

const MOCK_RESULT = {
  score: 72,
  verdict: 'Moderate Match',
  summary:
    'Your resume shows solid engineering experience but lacks containerization and cloud-native tooling the role requires.',
  matchedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  skillGaps: [
    {
      skill: 'Docker',
      importance: 'required',
      resources: [
        { platform: 'Official Docs', title: 'Docker Get Started Guide', url: 'https://docs.docker.com/get-started/' },
        { platform: 'YouTube', title: 'Docker Tutorial for Beginners – TechWorld with Nana', query: 'Docker Tutorial for Beginners TechWorld with Nana' },
      ],
    },
    {
      skill: 'Kubernetes',
      importance: 'required',
      resources: [
        { platform: 'Official Docs', title: 'Kubernetes Basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' },
      ],
    },
    {
      skill: 'AWS',
      importance: 'preferred',
      resources: [
        { platform: 'Official Docs', title: 'AWS Getting Started', url: 'https://aws.amazon.com/getting-started/' },
      ],
    },
  ],
}

const resultSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['Strong Match', 'Moderate Match', 'Weak Match']),
  summary: z.string(),
  matchedSkills: z.array(z.string()).max(8),
  skillGaps: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.enum(['required', 'preferred']),
        resources: z
          .array(
            z.object({
              platform: z.string(),
              title: z.string(),
              url: z.string().optional(),
              query: z.string().optional(),
            }),
          )
          .max(3),
      }),
    )
    .max(6),
})

type ResumeContent =
  | { type: 'pdf'; data: string }
  | { type: 'html'; data: string }
  | { type: 'text'; data: string }

const INSTRUCTIONS = (jobDescription: string) => `Analyze how well the resume matches the job description.

Return an object with:
- "score": integer 0–100 (how strong a candidate match this is)
- "verdict": "Strong Match" | "Moderate Match" | "Weak Match"
- "summary": 1–2 sentence plain-English explanation of the score
- "matchedSkills": skills/keywords present in both the resume and the job description (max 8)
- "skillGaps": skills in the job description missing from the resume (max 6). Each:
  { "skill", "importance": "required" | "preferred",
    "resources": 2–3 learning resources, each { "platform", "title", "url"?, "query"? } }

Resource rules: prefer official docs with a real "url"; for YouTube/Coursera give a "query" instead of a URL; never invent URLs.

JOB DESCRIPTION:
${jobDescription}`

function buildMessages(jobDescription: string, resume: ResumeContent): ModelMessage[] {
  const text = INSTRUCTIONS(jobDescription)
  if (resume.type === 'pdf') {
    return [
      {
        role: 'user',
        content: [
          { type: 'file', data: resume.data, mediaType: 'application/pdf' },
          { type: 'text', text },
        ],
      },
    ]
  }
  return [{ role: 'user', content: `${text}\n\nRESUME:\n${resume.data}` }]
}

export async function POST(request: Request) {
  try {
    const { jobDescription, resume, config } = (await request.json()) as {
      jobDescription: string
      resume: ResumeContent
      config?: Record<string, unknown>
    }

    if (!jobDescription?.trim() || !resume?.data?.trim()) {
      return Response.json({ error: 'Job description and resume are required.' }, { status: 400 })
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

    const result = await runObject(cfg, resultSchema, buildMessages(jobDescription, resume))
    return Response.json(result)
  } catch (err) {
    console.error('[resume-analyze]', err instanceof Error ? err.message : err)
    return Response.json({ error: friendlyAiError(err) }, { status: 502 })
  }
}
