export function friendlyAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const low = msg.toLowerCase()

  if (
    low.includes('api key') ||
    low.includes('apikey') ||
    low.includes('unauthorized') ||
    low.includes('authentication') ||
    low.includes('permission') ||
    low.includes('401') ||
    low.includes('403')
  ) {
    return 'The API key was rejected. Check the key (and the selected provider) in Settings.'
  }
  if (
    low.startsWith('model:') ||
    low.includes('not_found') ||
    (low.includes('model') &&
      (low.includes('not found') || low.includes('does not exist') || low.includes('not exist'))) ||
    low.includes('404') ||
    low.includes('unknown model')
  ) {
    return 'That model name is not available for the selected provider. Pick another in Settings.'
  }
  if (
    low.includes('rate limit') ||
    low.includes('429') ||
    low.includes('quota') ||
    low.includes('insufficient') ||
    low.includes('billing')
  ) {
    return 'Rate limit or quota reached for this key. Wait a bit, or check your provider billing/limits.'
  }
  if (
    low.includes('fetch failed') ||
    low.includes('econnrefused') ||
    low.includes('enotfound') ||
    low.includes('network') ||
    low.includes('timeout')
  ) {
    return 'Could not reach the provider. If you set a custom base URL (Ollama/LM Studio/proxy), make sure it is running.'
  }
  return msg
}
