export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5249').trim().replace(/\/$/, '')

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${API_BASE_URL}${normalizedPath}`
}
