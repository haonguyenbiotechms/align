'use client'

import { useRef, useState } from 'react'
import { saveRun } from '@/lib/saveRun'
import { mockQuestions, mockFeedback } from '@/lib/ai/client'

type Question = { id: number; type: string; question: string }
type Feedback = {
  rating: string
  score: number
  strengths: string[]
  improvements: string[]
  rewrite: string
}

const RATING_COLORS: Record<string, string> = {
  Excellent: 'text-green-700 bg-green-50 border-green-200',
  Good: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  Fair: 'text-amber-700 bg-amber-50 border-amber-200',
  'Needs Work': 'text-red-700 bg-red-50 border-red-200',
}

export default function MockInterviewPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<number, Feedback>>({})
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<'setup' | 'interview'>('setup')
  const savedRef = useRef(false)

  async function handleStart() {
    if (!jobDescription.trim()) { setError('Please paste a job description.'); return }
    setLoadingQuestions(true)
    setError(null)
    try {
      const data = await mockQuestions(jobDescription, resume)
      setQuestions(data.questions)
      setAnswers({}); setFeedbacks({})
      savedRef.current = false
      setStage('interview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoadingQuestions(false)
    }
  }

  async function handleGetFeedback(q: Question) {
    const answer = answers[q.id]
    if (!answer?.trim()) return
    setLoadingFeedback((prev) => ({ ...prev, [q.id]: true }))
    try {
      const data = await mockFeedback(q.question, answer, jobDescription)
      const updatedFeedbacks = { ...feedbacks, [q.id]: data }
      setFeedbacks(updatedFeedbacks)

      const allDone = questions.every((qq) => updatedFeedbacks[qq.id])
      if (allDone && !savedRef.current) {
        savedRef.current = true
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const firstLine = jobDescription.split('\n').find((l) => l.trim())?.trim().slice(0, 45) || 'Mock Interview'
        await saveRun('mock-interview', `${firstLine} — ${date}`, { jobDescription, questions, answers, feedbacks: updatedFeedbacks })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get feedback.')
    } finally {
      setLoadingFeedback((prev) => ({ ...prev, [q.id]: false }))
    }
  }

  const textareaClass = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mock Interview</h1>
      <p className="text-sm text-gray-600 mb-8">Practice tailored interview questions and get AI feedback on each answer.</p>

      {stage === 'setup' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Job Description <span className="text-red-400">*</span></label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description…" rows={8} className={textareaClass} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Your Resume <span className="text-gray-500 font-normal">(optional — helps tailor questions)</span>
            </label>
            <textarea value={resume} onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume for more personalized questions…" rows={6} className={textareaClass} />
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <button onClick={handleStart} disabled={loadingQuestions} className="btn-primary">
            {loadingQuestions ? 'Generating questions…' : 'Start Interview'}
          </button>
        </div>
      )}

      {stage === 'interview' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{questions.length} questions — answer each and click Get Feedback</p>
            <button onClick={() => { setStage('setup'); setQuestions([]); setError(null) }}
              className="text-xs text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 transition">
              ← Start over
            </button>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          {questions.map((q, idx) => {
            const fb = feedbacks[q.id]
            const isLoadingFb = loadingFeedback[q.id]
            return (
              <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{q.type}</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">{q.question}</p>
                  </div>
                </div>

                <textarea value={answers[q.id] || ''} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer here…" rows={4} className={textareaClass} />

                {!fb && (
                  <button onClick={() => handleGetFeedback(q)} disabled={!answers[q.id]?.trim() || isLoadingFb}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    {isLoadingFb ? 'Getting feedback…' : 'Get Feedback →'}
                  </button>
                )}

                {fb && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 inline-block ${RATING_COLORS[fb.rating] || ''}`}>
                      {fb.rating} · {fb.score}/10
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1.5">Strengths</p>
                        <ul className="space-y-1">
                          {fb.strengths.map((s, i) => <li key={i} className="text-xs text-gray-600">✓ {s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-600 mb-1.5">Improve</p>
                        <ul className="space-y-1">
                          {fb.improvements.map((s, i) => <li key={i} className="text-xs text-gray-600">→ {s}</li>)}
                        </ul>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed">{fb.rewrite}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
