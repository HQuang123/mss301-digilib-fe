const fileBaseUrl = (import.meta.env.DEV ? '' : import.meta.env.VITE_FILE_BASE_URL || '').replace(/\/$/, '')
const apiBaseUrl = (import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function getOrigin(baseUrl) {
  if (!baseUrl) return ''

  try {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    return new URL(baseUrl, fallbackOrigin).origin
  } catch {
    return ''
  }
}

export function resolveBackendFileUrls(path) {
  if (!path) return []
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) return [path]

  if (path.startsWith('/files/')) {
    const candidates = []
    if (apiBaseUrl) candidates.push(`${apiBaseUrl}${path}`)
    if (fileBaseUrl && fileBaseUrl !== apiBaseUrl) candidates.push(`${fileBaseUrl}${path}`)

    const backendOrigin = getOrigin(apiBaseUrl)
    if (backendOrigin) candidates.push(`${backendOrigin}${path}`)

    candidates.push(path)
    return [...new Set(candidates)]
  }

  if (path.startsWith('/')) {
    if (apiBaseUrl) return [`${apiBaseUrl}${path}`]

    const backendOrigin = getOrigin(apiBaseUrl)
    if (backendOrigin) return [`${backendOrigin}${path}`]
  }

  return [apiBaseUrl ? `${apiBaseUrl}/${path}` : path]
}

export function resolveBackendFileUrl(path) {
  return resolveBackendFileUrls(path)[0] || null
}
