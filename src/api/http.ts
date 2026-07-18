const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

export interface ApiFieldErrors {
  [fieldName: string]: string
}

export interface ApiError {
  status: number
  title: string
  detail: string
  fieldErrors: ApiFieldErrors
  rawBody?: unknown
}

interface JsonErrorPayload {
  title?: unknown
  detail?: unknown
  errors?: unknown
}

interface JsonRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown
  fallbackTitle?: string
  fallbackDetail?: string
  headers?: HeadersInit
}

function buildApiUrl(path: string): string {
  if (!apiBaseUrl) {
    return path
  }

  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  return new URL(normalizedPath, normalizedBase).toString()
}

function normalizeFieldName(name: string): string {
  return String(name)
    .replace(/^request\./i, '')
    .split('.')
    .pop()
    ?.trim()
    .toLowerCase()
    ?? ''
}

function firstProblemMessage(value: unknown): string {
  if (Array.isArray(value)) {
    return (
      value.find((item) => typeof item === 'string' && item.trim())?.trim() ?? ''
    )
  }

  return typeof value === 'string' ? value.trim() : ''
}

function extractProblemPayload(problem: unknown): {
  title: string
  detail: string
  fieldErrors: ApiFieldErrors
} {
  if (!problem || typeof problem !== 'object') {
    return { title: '', detail: '', fieldErrors: {} }
  }

  const payload = problem as JsonErrorPayload
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const detail = typeof payload.detail === 'string' ? payload.detail.trim() : ''
  const rawErrors = payload.errors && typeof payload.errors === 'object' ? payload.errors : null

  if (!rawErrors) {
    return { title, detail, fieldErrors: {} }
  }

  const fieldErrors = Object.entries(rawErrors as Record<string, unknown>).reduce<ApiFieldErrors>(
    (accumulator, [fieldName, value]) => {
      const mappedFieldName = normalizeFieldName(fieldName)
      const message = firstProblemMessage(value)

      if (mappedFieldName && message) {
        accumulator[mappedFieldName] = message
      }

      return accumulator
    },
    {},
  )

  return { title, detail, fieldErrors }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { detail: text } : null
}

function createApiError(
  response: Response,
  body: unknown,
  fallbackTitle: string,
  fallbackDetail: string,
): ApiError {
  const { title, detail, fieldErrors } = extractProblemPayload(body)

  if (response.status === 400) {
    return {
      status: response.status,
      title: title || fallbackTitle,
      detail: detail || fallbackDetail,
      fieldErrors,
      rawBody: body,
    }
  }

  if (response.status === 401) {
    return {
      status: response.status,
      title: title || fallbackTitle || 'Login failed',
      detail: detail || fallbackDetail || 'Invalid credentials.',
      fieldErrors,
      rawBody: body,
    }
  }

  return {
    status: response.status,
    title: title || fallbackTitle,
    detail: detail || fallbackDetail,
    fieldErrors,
    rawBody: body,
  }
}

export async function requestJson<TResponse>(
  path: string,
  options: JsonRequestOptions = {},
): Promise<TResponse> {
  const { body, fallbackTitle = 'Request failed', fallbackDetail = 'Unable to complete the request.', headers, ...requestInit } = options
  const response = await fetch(buildApiUrl(path), {
    ...requestInit,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const responseBody = await readResponseBody(response)

  if (!response.ok) {
    throw createApiError(response, responseBody, fallbackTitle, fallbackDetail)
  }

  return responseBody as TResponse
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'title' in error &&
    'detail' in error &&
    'fieldErrors' in error
  )
}
