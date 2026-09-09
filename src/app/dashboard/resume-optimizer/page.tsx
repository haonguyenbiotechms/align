'use client'

import { useRef, useState } from 'react'
import { saveRun } from '@/lib/saveRun'
import { resourceUrl, type Resource } from '@/lib/resourceUrl'
import { analyzeResume, optimizeResume } from '@/lib/ai/client'
import { sanitizeResumeHtml } from '@/lib/sanitizeHtml'

type SkillGap = {
  skill: string
  importance: 'required' | 'preferred'
  resources?: Resource[]
}
type Analysis = {
  score: number
  verdict: string
  summary: string
  matchedSkills: string[]
  skillGaps: SkillGap[]
}
type ResumeContent = { type: 'pdf' | 'html' | 'text'; data: string }

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626'
  const label = score >= 70 ? 'Strong Match' : score >= 45 ? 'Moderate Match' : 'Weak Match'
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}%</text>
        <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#6b7280">match</text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

async function fileToResumeContent(file: File): Promise<ResumeContent> {
  if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    return { type: 'html', data: result.value }
  }

  if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve({ type: 'pdf', data: result.split(',')[1] })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX.')
}

export default function ResumeAnalyzerPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [optimizedHtml, setOptimizedHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeFile(file)
    setResumeText('')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleRemoveFile() {
    setResumeFile(null)
  }

  async function handleAnalyze() {
    if (!jobDescription.trim()) { setError('Please paste a job description.'); return }
    if (!resumeFile && !resumeText.trim()) { setError('Please upload a resume file or paste your resume as text.'); return }

    setPreparing(true)
    setError(null)

    let resume: ResumeContent
    try {
      resume = resumeFile ? await fileToResumeContent(resumeFile) : { type: 'text', data: resumeText }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file.')
      setPreparing(false)
      return
    }

    setPreparing(false)
    setLoading(true)
    setAnalysis(null)
    setOptimizedHtml('')

    try {
      const [analysisData, optimizeHtml] = await Promise.all([
        analyzeResume(jobDescription, resume),
        optimizeResume(jobDescription, resume),
      ])

      const cleanHtml = sanitizeResumeHtml(optimizeHtml || '')
      setAnalysis(analysisData)
      setOptimizedHtml(cleanHtml)

      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const firstLine = jobDescription.split('\n').find((l) => l.trim())?.trim().slice(0, 50) || 'Resume Analysis'
      await saveRun('resume-analyzer', `${firstLine} — ${date}`, { jobDescription, analysis: analysisData, optimizedHtml: cleanHtml })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadDocx() {
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

  async function handleDownloadPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 60
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2
    const lineHeight = 14
    let y = margin
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const text = optimizedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    for (const line of doc.splitTextToSize(text, maxWidth)) {
      if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin }
      doc.text(line, margin, y); y += lineHeight
    }
    doc.save('optimized-resume.pdf')
  }

  const textareaClass = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Resume Analyzer</h1>
      <p className="text-sm text-gray-600 mb-8">Upload your resume and a job description to get a match score, skill gaps, and an optimized resume.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Job Description</label>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..." rows={14} className={textareaClass} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Your Resume</label>
            {!resumeFile && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 transition">
                Upload PDF / DOCX
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileSelect} className="hidden" />
          </div>

          {resumeFile ? (
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="text-sm text-indigo-700 font-medium truncate flex-1">{resumeFile.name}</span>
                <button onClick={handleRemoveFile} className="text-xs text-gray-500 hover:text-gray-600 transition shrink-0">Remove</button>
              </div>
              <div className="flex-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center min-h-44">
                <p className="text-xs text-gray-500 text-center px-4">File ready. Original formatting will be preserved in the optimized output.</p>
              </div>
            </div>
          ) : (
            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
              placeholder="Or paste your resume as plain text here..." rows={14} className={textareaClass} />
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <button onClick={handleAnalyze} disabled={loading || preparing} className="btn-primary">
        {preparing ? 'Reading file…' : loading ? 'Analyzing…' : 'Analyze & Optimize'}
      </button>

      {(analysis || loading) && (
        <div className="mt-10 space-y-6">

          {analysis ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <ScoreRing score={analysis.score} />
                <div className="flex-1 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{analysis.summary}</p>
                  {analysis.matchedSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matched Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.matchedSkills.map((s) => (
                          <span key={s} className="rounded-full bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-0.5">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.skillGaps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skill Gaps</p>
                      <div className="space-y-2">
                        {analysis.skillGaps.map((gap) => (
                          <div key={gap.skill} className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border text-xs px-2.5 py-0.5 ${gap.importance === 'required' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                              {gap.skill} · {gap.importance}
                            </span>
                            {gap.resources?.map((r) => (
                              <a key={r.title} href={resourceUrl(r)} target="_blank" rel="noopener noreferrer" title={r.title}
                                className="text-xs text-indigo-600 hover:text-indigo-700 border border-indigo-100 hover:border-indigo-200 rounded px-1.5 py-0.5 bg-indigo-50 transition">
                                {r.platform}
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 animate-pulse">
              Analyzing your resume against the job description…
            </div>
          )}

          {(optimizedHtml || (loading && analysis)) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Optimized Resume
                  {loading && <span className="ml-2 text-sm font-normal text-indigo-400 animate-pulse">Generating…</span>}
                </h2>
                {optimizedHtml && !loading && (
                  <div className="flex gap-2">
                    <button onClick={handleDownloadDocx} className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>
                      Download DOCX
                    </button>
                    <button onClick={handleDownloadPdf} className="btn-secondary">
                      Download PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-center bg-gray-100 rounded-xl p-6">
                {optimizedHtml ? (
                  <div className="w-full max-w-2xl bg-white shadow-sm rounded-lg px-12 py-10 min-h-96"
                    style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt', lineHeight: '1.5', color: '#111' }}
                    dangerouslySetInnerHTML={{ __html: `<style>
                      h1 { font-size: 18pt; font-weight: bold; margin: 0 0 4pt; color: #111; }
                      h2 { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #333; margin: 12pt 0 4pt; text-transform: uppercase; letter-spacing: 0.05em; color: #111; }
                      p { margin: 2pt 0; color: #111; }
                      ul { margin: 2pt 0 4pt 18pt; padding: 0; }
                      li { margin-bottom: 2pt; color: #111; }
                      strong { font-weight: bold; color: #111; }
                      em { font-style: italic; }
                    </style>${optimizedHtml}` }} />
                ) : (
                  <div className="w-full max-w-2xl bg-white shadow-sm rounded-lg px-12 py-10 min-h-96 flex items-center justify-center">
                    <p className="text-sm text-gray-500 animate-pulse">Generating optimized resume…</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
