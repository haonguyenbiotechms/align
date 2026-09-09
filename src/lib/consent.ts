'use client'

const KEY = 'align.web-consent'

export function hasConsented(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setConsented() {
  try {
    window.localStorage.setItem(KEY, '1')
  } catch {
    // ignore
  }
}
