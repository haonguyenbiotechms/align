'use client'

// Local-only run history. Stored in the browser (localStorage) — nothing leaves
// the machine, no account required.

export type Run = {
  id: string
  feature: string
  title: string
  data: unknown
  created_at: string
}

const KEY = 'align.history'

function read(): Run[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Run[]) : []
  } catch {
    return []
  }
}

function write(runs: Run[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(runs))
  } catch {
    // storage disabled or over quota — saving history is non-critical
  }
}

export function listRuns(): Run[] {
  return read().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function saveRun(feature: string, title: string, data: object): Promise<Run> {
  const run: Run = {
    id: crypto.randomUUID(),
    feature,
    title,
    data,
    created_at: new Date().toISOString(),
  }
  write([run, ...read()])
  return run
}

export function deleteRun(id: string) {
  write(read().filter((r) => r.id !== id))
}

export function clearRuns() {
  write([])
}
