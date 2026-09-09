import { z } from 'zod'
import type { ModelMessage } from 'ai'

// Prompt builders, schemas, and demo fixtures for each tool. No server or
// browser dependency — used by the browser AI client on this branch.

export type ResumeContent =
  | { type: 'pdf'; data: string }
  | { type: 'html'; data: string }
  | { type: 'text'; data: string }

function pdfOrText(text: string, resume: ResumeContent, label: string): ModelMessage[] {
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
  const heading = resume.type === 'html' ? `${label} (HTML):` : `${label}:`
  return [{ role: 'user', content: `${text}\n\n${heading}\n${resume.data}` }]
}

/* ------------------------------------------------------------------ analyze */

export const analyzeSchema = z.object({
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
export type Analysis = z.infer<typeof analyzeSchema>

export function analyzeMessages(jobDescription: string, resume: ResumeContent): ModelMessage[] {
  const text = `Analyze how well the resume matches the job description.

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
  return pdfOrText(text, resume, 'RESUME')
}

export const analyzeMock: Analysis = {
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

/* ----------------------------------------------------------------- optimize */

export function optimizeMessages(jobDescription: string, resume: ResumeContent): ModelMessage[] {
  const text = `You are an expert resume writer. Optimize the resume to better match the job description.

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
  return pdfOrText(text, resume, 'ORIGINAL RESUME')
}

export const optimizeMock = `<h1>Jane Doe</h1>
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

/* --------------------------------------------------------- interview: questions */

export const questionsSchema = z.object({
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

export function questionsPrompt(jobDescription: string, resume?: string): string {
  const resumeContext = resume?.trim() ? `\n\nCANDIDATE RESUME:\n${resume}` : ''
  return `Generate exactly 5 interview questions for the following role. Mix behavioral, technical, and situational questions relevant to this specific job.${
    resumeContext ? " Tailor some questions to the candidate's background." : ''
  }
Each item: { "id": number, "type": "Behavioral" | "Technical" | "Situational", "question": string }

JOB DESCRIPTION:
${jobDescription}${resumeContext}`
}

export const questionsMock = {
  questions: [
    { id: 1, type: 'Behavioral', question: 'Tell me about a time you led a project under a tight deadline. What was your approach and outcome?' },
    { id: 2, type: 'Technical', question: 'How would you optimize a React application that is re-rendering too frequently?' },
    { id: 3, type: 'Situational', question: 'You discover a critical bug in production 30 minutes before a major demo. Walk me through what you do.' },
    { id: 4, type: 'Behavioral', question: "Describe a time you had to push back on a stakeholder's request. How did you handle it?" },
    { id: 5, type: 'Technical', question: 'Explain the difference between REST and GraphQL. When would you choose one over the other?' },
  ],
}

/* --------------------------------------------------------- interview: feedback */

export const feedbackSchema = z.object({
  rating: z.enum(['Excellent', 'Good', 'Fair', 'Needs Work']),
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()).min(1).max(2),
  improvements: z.array(z.string()).min(1).max(2),
  rewrite: z.string(),
})

export function feedbackPrompt(question: string, answer: string, jobDescription?: string): string {
  return `You are an expert interviewer. Evaluate this interview answer.

Return:
- "rating": "Excellent" | "Good" | "Fair" | "Needs Work"
- "score": integer 1–10
- "strengths": 1–2 short strings
- "improvements": 1–2 short strings
- "rewrite": 1–2 sentence coaching tip on how to make the answer stronger

ROLE CONTEXT: ${jobDescription || 'Not provided'}

QUESTION: ${question}

CANDIDATE ANSWER: ${answer}`
}

export const feedbackMock = {
  rating: 'Good',
  score: 7,
  strengths: ['Clear structure', 'Specific example provided'],
  improvements: ['Quantify the outcome with a metric', "Briefly mention what you'd do differently"],
  rewrite:
    'Strong answer overall. Consider adding a concrete result — e.g., "which reduced deploy time by 40%" — to make the impact more memorable.',
}

/* -------------------------------------------------------------- skill gap */

export const skillGapSchema = z.object({
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
export type SkillGapResult = z.infer<typeof skillGapSchema>

export function skillGapPrompt(jobDescription: string, background: string): string {
  return `Compare the candidate's background to the job description and identify the skill gaps.

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
${background}`
}

export const skillGapMock: SkillGapResult = {
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
