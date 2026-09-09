export type Resource = {
  platform: string
  title: string
  url?: string
  query?: string
}

export function resourceUrl(r: Resource): string {
  // Only trust http(s) URLs from the model — never javascript:, data:, etc.
  if (r.url && /^https?:\/\//i.test(r.url.trim())) return r.url.trim()
  const q = encodeURIComponent(r.query || r.title)
  switch (r.platform) {
    case 'YouTube':     return `https://www.youtube.com/results?search_query=${q}`
    case 'Coursera':    return `https://www.coursera.org/search?query=${q}&price=Free`
    case 'edX':         return `https://www.edx.org/search?q=${q}&price=Free`
    case 'MDN':         return `https://developer.mozilla.org/en-US/search?q=${q}`
    case 'freeCodeCamp':return `https://www.freecodecamp.org/news/search/?query=${q}`
    case 'The Odin Project': return `https://www.theodinproject.com/`
    default:            return `https://www.google.com/search?q=${q}+free+course`
  }
}
