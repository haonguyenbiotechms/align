import type { ModelMessage } from 'ai'
import { resolveConfig } from '@/lib/ai/config'
import { runText } from '@/lib/ai/run'
import { friendlyAiError } from '@/lib/ai/errors'

const MOCK_RESPONSE = `<h1>Jane Doe</h1>
<p>jane.doe@email.com | linkedin.com/in/janedoe | github.com/janedoe</p>
<h2>Summary</h2>
<p>Results-driven software engineer with 4+ years building scalable web applications. Proven track record delivering high-quality features, reducing infrastructure costs by $120K/year, and collaborating cross-functionally to ship products on time.</p>
<h2>Experience</h2>
<p><strong>Senior Software Engineer — Acme Corp (2021–Present)</strong></p>
<ul>
<li>Architected a microservices migration reducing API latency by 40% and cutting infrastructure costs by $120K/year</li>
<li>Led a team of 4 to deliver a real-time dashboard, increasing user engagement by 28%</li>
<li>Built CI/CD pipelines that cut deployment time from 45 minutes to under 8 minutes</li>
</ul>
<h2>Skills</h2>
<p>TypeScript, React, Node.js, Python, PostgreSQL, AWS, Docker, Kubernetes</p>
<h2>Education</h2>
<p>B.S. Computer Science — State University, 2019</p>`

type ResumeContent =
  | { type: 'pdf'; data: string }
  | { type: 'html'; data: string }
  | { type: 'text'; data: string }

const INSTRUCTIONS = (jobDescription: string) => `You are an expert resume writer. Optimize the resume to better match the job description.

STRICT RULES — never break these:
- Every fact, skill, company, date, title, and achievement must come from the original resume. Do not invent anything.
- Do not add numbers or percentages not in the original.
- Preserve the exact same sections and section order.

What you CAN do:
- Reword bullet points to use keywords from the job description naturally
- Reorder bullets within a section to lead with the most relevant points
- Tighten language — remove filler words and passive voice
- Reorder skills to front-load those most relevant to the job

OUTPUT FORMAT: Return the full optimized resume as clean semantic HTML only
(<h1> name, <h2> sections, <p>, <ul><li>, <strong>, <em>). No preamble, no markdown, no code fences.

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
  const label = resume.type === 'html' ? 'ORIGINAL RESUME (HTML):' : 'ORIGINAL RESUME:'
  return [{ role: 'user', content: `${text}\n\n${label}\n${resume.data}` }]
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
      return Response.json({ html: MOCK_RESPONSE })
    }

    const cfg = resolveConfig(config)
    if (!cfg) {
      return Response.json(
        { error: 'No AI provider configured. Open Settings and add your API key.' },
        { status: 400 },
      )
    }

    const raw = await runText(cfg, buildMessages(jobDescription, resume))
    const html = raw
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    return Response.json({ html })
  } catch (err) {
    console.error('[resume-optimizer]', err instanceof Error ? err.message : err)
    return Response.json({ error: friendlyAiError(err) }, { status: 502 })
  }
}
