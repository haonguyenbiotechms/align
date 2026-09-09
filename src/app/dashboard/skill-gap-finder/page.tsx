'use client'

import { useState } from 'react'
import { saveRun } from '@/lib/saveRun'
import { findSkillGaps } from '@/lib/ai/client'

type Gap = { skill: string; importance: 'required' | 'preferred'; jdEvidence: string; note: string }
type Partial = { skill: string; note: string }
type Result = { gaps: Gap[]; partialMatches: Partial[]; strengths: string[] }

export default function SkillGapFinderPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [background, setBackground] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    if (!jobDescription.trim() || !background.trim()) {
      setError('Fill in both boxes.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data: Result = await findSkillGaps(jobDescription, background)
      setResult(data)
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const firstLine = jobDescription.split('\n').find((l) => l.trim())?.trim().slice(0, 45) || 'Skill Gap'
      await saveRun('skill-gap-finder', `${firstLine} — ${date}`, { jobDescription, result: data })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Skill Gap Finder</h1>
      <p className="text-sm text-gray-600 mb-6">
        A quick check: paste a job description and your background, and see the key skills the role
        asks for that you don&apos;t show yet. No score, no rewrite — just the gaps.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job description</label>
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-sm h-40 outline-none focus:border-indigo-400"
            placeholder="Paste the full job posting…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your background — a resume, or just a list of your skills and experience
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-sm h-40 outline-none focus:border-indigo-400"
            placeholder="Paste your resume text, or write a few lines: languages, tools, years, domains…"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button onClick={handleRun} disabled={loading} className="btn-primary" style={{ padding: '10px 22px' }}>
          {loading ? 'Analyzing…' : 'Find skill gaps'}
        </button>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Gaps ({result.gaps.length})
            </h2>
            <div className="space-y-3">
              {result.gaps.map((g) => (
                <div key={g.skill} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{g.skill}</span>
                    <span
                      className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${
                        g.importance === 'required'
                          ? 'text-red-600 bg-red-50 border-red-200'
                          : 'text-amber-600 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {g.importance}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-1.5">JD: {g.jdEvidence}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{g.note}</p>
                </div>
              ))}
              {result.gaps.length === 0 && (
                <p className="text-sm text-gray-500">No significant gaps found — you match this role well.</p>
              )}
            </div>
          </section>

          {result.partialMatches.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Partial matches</h2>
              <div className="space-y-2">
                {result.partialMatches.map((p) => (
                  <div key={p.skill} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">{p.skill}</span>
                    <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{p.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.strengths.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">You already have</h2>
              <div className="flex flex-wrap gap-2">
                {result.strengths.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium rounded-full px-2.5 py-1 bg-green-50 text-green-700 border border-green-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
