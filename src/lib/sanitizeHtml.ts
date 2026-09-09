'use client'

import DOMPurify from 'dompurify'

// The AI returns an HTML resume that we render with dangerouslySetInnerHTML and
// feed to the DOCX/PDF exporters. A booby-trapped job description could try to
// make the model emit <script>/<img onerror>/etc. — sanitize to a small, safe
// subset (formatting tags only, no scripts, no event handlers, no javascript:
// URLs) before it ever touches the DOM.
export function sanitizeResumeHtml(dirty: string): string {
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 'br', 'hr', 'span', 'a', 'small',
    ],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  })
}
