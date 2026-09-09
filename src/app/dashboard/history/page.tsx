'use client'

import { useEffect, useState } from 'react'
import { resourceUrl } from '@/lib/resourceUrl'
import { listRuns, deleteRun, clearRuns, type Run } from '@/lib/saveRun'
import { sanitizeResumeHtml } from '@/lib/sanitizeHtml'

const FEATURE_LABEL: Record<string, string> = {
  'resume-analyzer': 'Resume Analyzer',
  'skill-gap-finder': 'Skill Gap Finder',
  'job-scanner': 'Job Scanner',
  'mock-interview': 'Mock Interview',
}

const FEATURE_ICON: Record<string, string> = {
  'resume-analyzer': '📄',
  'skill-gap-finder': '🔎',
  'job-scanner': '🔍',
  'mock-interview': '🎤',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const RESUME_INLINE_STYLES = `<style>
  h1 { font-size: 18pt; font-weight: bold; margin: 0 0 4pt; color: #111; }
  h2 { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; margin: 12pt 0 4pt; text-transform: uppercase; letter-spacing: 0.05em; color: #111; }
  p { margin: 2pt 0; color: #111; }
  ul { margin: 2pt 0 4pt 18pt; padding: 0; }
  li { margin-bottom: 2pt; color: #111; }
  strong { font-weight: bold; color: #111; }
  em { font-style: italic; }
  body, div { color: #111; }
</style>`

function ResumeAnalyzerDetail({ data }: { data: any }) {
  const { analysis, optimizedHtml: rawHtml } = data
  const optimizedHtml = sanitizeResumeHtml(rawHtml || '')
  if (!analysis) return null

  async function downloadDocx() {
    const htmlDocx = (await import('html-docx-js/dist/html-docx')).default
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
      h1 { font-size: 16pt; margin-bottom: 4pt; }
      h2 { font-size: 12pt; border-bottom: 1px solid #000; margin-top: 12pt; margin-bottom: 4pt; }
      p { margin: 2pt 0; } ul { margin: 2pt 0 2pt 18pt; padding: 0; } li { margin-bottom: 2pt; }
    </style></head><body>${optimizedHtml}</body></html>`
    const blob = htmlDocx.asBlob(fullHtml)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'optimized-resume.docx'; a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 60
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2
    let y = margin
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    const text = optimizedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    for (const line of doc.splitTextToSize(text, maxWidth)) {
      if (y + 14 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin }
      doc.text(line, margin, y); y += 14
    }
    doc.save('optimized-resume.pdf')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold" style={{ color: analysis.score >= 70 ? '#16a34a' : analysis.score >= 45 ? '#d97706' : '#dc2626' }}>
          {analysis.score}%
        </span>
        <span className="text-sm font-medium text-gray-700">{analysis.verdict}</span>
      </div>
      <p className="text-sm text-gray-600">{analysis.summary}</p>
      {analysis.matchedSkills?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Matched Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.matchedSkills.map((s: string) => (
              <span key={s} className="rounded-full bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-0.5">{s}</span>
            ))}
          </div>
        </div>
      )}
      {analysis.skillGaps?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Skill Gaps</p>
          <div className="space-y-2">
            {analysis.skillGaps.map((g: any) => (
              <div key={g.skill} className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border text-xs px-2.5 py-0.5 ${g.importance === 'required' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                  {g.skill} · {g.importance}
                </span>
                {g.resources?.map((r: any) => (
                  <a key={r.title} href={resourceUrl(r)} target="_blank" rel="noopener noreferrer"
                    title={r.title}
                    className="text-xs text-blue-600 hover:underline border border-blue-100 rounded px-1.5 py-0.5 bg-blue-50">
                    {r.platform}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {optimizedHtml && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optimized Resume</p>
            <div className="flex gap-2">
              <button onClick={downloadDocx} className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-2 py-1">Download DOCX</button>
              <button onClick={downloadPdf} className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200 rounded px-2 py-1">Download PDF</button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-8 py-6 text-sm"
            style={{ fontFamily: 'Calibri, Arial, sans-serif', lineHeight: '1.5', color: '#111' }}
            dangerouslySetInnerHTML={{ __html: RESUME_INLINE_STYLES + optimizedHtml }} />
        </div>
      )}
    </div>
  )
}

function SkillGapDetail({ data }: { data: any }) {
  const r = data?.result
  if (!r) return null
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gaps</p>
        <ul className="space-y-1.5">
          {(r.gaps ?? []).map((g: any) => (
            <li key={g.skill} className="text-gray-700">
              <span className="font-medium">{g.skill}</span>{' '}
              <span className="text-xs text-gray-400">({g.importance})</span> — {g.note}
            </li>
          ))}
        </ul>
      </div>
      {r.strengths?.length > 0 && (
        <p className="text-gray-600">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Have: </span>
          {r.strengths.join(', ')}
        </p>
      )}
    </div>
  )
}

function JobScannerDetail({ data }: { data: any }) {
  const { result } = data
  if (!result) return null
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{result.company} · {result.employmentType} · {result.experienceLevel}</p>
      <p className="text-sm text-gray-700">{result.summary}</p>
      {result.requiredSkills?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Required Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {result.requiredSkills.map((s: string) => (
              <span key={s} className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-0.5">{s}</span>
            ))}
          </div>
        </div>
      )}
      {result.redFlags?.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1.5">Red Flags</p>
          {result.redFlags.map((f: string, i: number) => (
            <p key={i} className="text-xs text-red-700">⚠ {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function MockInterviewDetail({ data }: { data: any }) {
  const { questions, answers, feedbacks } = data
  if (!questions?.length) return null
  return (
    <div className="space-y-4">
      {questions.map((q: any, i: number) => {
        const fb = feedbacks?.[q.id]
        return (
          <div key={q.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase">{q.type} · Q{i + 1}</p>
            <p className="text-sm font-medium text-gray-900">{q.question}</p>
            {answers?.[q.id] && <p className="text-sm text-gray-600 italic">"{answers[q.id]}"</p>}
            {fb && (
              <div className="flex items-center gap-2 pt-1">
                <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${
                  fb.rating === 'Excellent' ? 'text-green-600 bg-green-50 border-green-200' :
                  fb.rating === 'Good' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                  fb.rating === 'Fair' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                  'text-red-600 bg-red-50 border-red-200'
                }`}>{fb.rating} · {fb.score}/10</span>
                <p className="text-xs text-gray-500">{fb.rewrite}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    setRuns(listRuns())
    setLoading(false)
  }, [])

  function handleDelete(id: string) {
    setDeleting(id)
    deleteRun(id)
    setRuns((prev) => prev.filter((r) => r.id !== id))
    if (expanded === id) setExpanded(null)
    setDeleting(null)
  }

  const filtered = filter === 'all' ? runs : runs.filter((r) => r.feature === filter)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">History</h1>
          <p className="text-sm text-gray-600 mb-6">
            All your previous runs, saved in this browser only.
          </p>
        </div>
        {runs.length > 0 && (
          <button
            onClick={() => {
              if (!confirm(`Delete all ${runs.length} saved runs from this browser?`)) return
              clearRuns()
              setRuns([])
              setExpanded(null)
            }}
            className="text-xs text-gray-400 hover:text-red-500 transition mt-1"
          >
            Clear all history
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'resume-analyzer', 'skill-gap-finder', 'mock-interview'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              filter === f
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {f === 'all' ? 'All' : FEATURE_LABEL[f]}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500 animate-pulse">Loading history…</div>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No runs yet. Results will appear here automatically after each use.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((run) => (
          <div key={run.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{FEATURE_ICON[run.feature]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{run.title}</p>
                <p className="text-xs text-gray-500">{FEATURE_LABEL[run.feature]} · {timeAgo(run.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition">
                  {expanded === run.id ? 'Hide' : 'View'}
                </button>
                <button onClick={() => handleDelete(run.id)} disabled={deleting === run.id}
                  className="text-xs text-gray-500 hover:text-red-500 transition disabled:opacity-40">
                  {deleting === run.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>

            {expanded === run.id && (
              <div className="border-t border-gray-100 px-4 py-4">
                {run.feature === 'resume-analyzer' && <ResumeAnalyzerDetail data={run.data} />}
                {run.feature === 'skill-gap-finder' && <SkillGapDetail data={run.data} />}
                {run.feature === 'job-scanner' && <JobScannerDetail data={run.data} />}
                {run.feature === 'mock-interview' && <MockInterviewDetail data={run.data} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
