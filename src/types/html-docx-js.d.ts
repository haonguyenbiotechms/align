// html-docx-js ships no types for its deep import path.
declare module 'html-docx-js/dist/html-docx' {
  const htmlDocx: {
    asBlob(html: string, options?: Record<string, unknown>): Blob
  }
  export default htmlDocx
}
