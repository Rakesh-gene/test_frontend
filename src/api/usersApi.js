const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

function buildApiUrl(path) {
  if (!apiBaseUrl) {
    return path
  }

  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  return new URL(normalizedPath, normalizedBase).toString()
}

function normalizeFieldName(name) {
  return String(name)
    .replace(/^request\./i, '')
    .split('.')
    .pop()
    ?.trim()
    .toLowerCase()
}

function mapFieldName(name) {
  const normalized = normalizeFieldName(name)

  switch (normalized) {
    case 'firstname':
      return 'firstName'
    case 'lastname':
      return 'lastName'
    case 'email':
      return 'email'
    default:
      return null
  }
}

function firstProblemMessage(value) {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === 'string' && item.trim())?.trim() ?? ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

function extractProblemPayload(problem) {
  if (!problem || typeof problem !== 'object') {
    return { title: '', detail: '', fieldErrors: {} }
  }

  const payload = problem
  const title = typeof payload.title === 'string' ? payload.title : ''
  const detail = typeof payload.detail === 'string' ? payload.detail : ''
  const rawErrors = payload.errors && typeof payload.errors === 'object' ? payload.errors : {}

  const fieldErrors = Object.entries(rawErrors).reduce((accumulator, [fieldName, value]) => {
    const mappedFieldName = mapFieldName(fieldName)
    const message = firstProblemMessage(value)

    if (mappedFieldName && message) {
      accumulator[mappedFieldName] = message
    }

    return accumulator
  }, {})

  return { title, detail, fieldErrors }
}

function createUsersError(response, body, fallbackTitle, fallbackDetail) {
  const { title, detail, fieldErrors } = extractProblemPayload(body)
  const status = response.status

  if (status === 409) {
    return {
      status,
      title: title || 'Email already in use',
      detail: detail || 'A user with that email already exists.',
      fieldErrors: {
        email: detail || title || 'A user with that email already exists.',
        ...fieldErrors,
      },
    }
  }

  if (status === 400) {
    return {
      status,
      title: title || fallbackTitle || 'Please check the highlighted fields',
      detail: detail || fallbackDetail || 'One or more values are invalid.',
      fieldErrors,
    }
  }

  if (status === 404) {
    return {
      status,
      title: title || 'User not found',
      detail: detail || 'The selected user could not be found.',
      fieldErrors,
    }
  }

  return {
    status,
    title: title || fallbackTitle,
    detail: detail || fallbackDetail,
    fieldErrors,
  }
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { detail: text } : null
}

function normalizeUsersPage(body, fallbackPage, fallbackPageSize) {
  if (Array.isArray(body)) {
    return {
      items: body,
      totalCount: body.length,
      page: fallbackPage,
      pageSize: fallbackPageSize,
    }
  }

  if (!body || typeof body !== 'object') {
    return {
      items: [],
      totalCount: 0,
      page: fallbackPage,
      pageSize: fallbackPageSize,
    }
  }

  const items =
    (Array.isArray(body.items) && body.items) ||
    (Array.isArray(body.data) && body.data) ||
    (Array.isArray(body.users) && body.users) ||
    (Array.isArray(body.results) && body.results) ||
    []

  const totalCount =
    Number(body.totalCount ?? body.total ?? body.count ?? body.totalItems ?? items.length) || 0

  return {
    items,
    totalCount,
    page: Number(body.page ?? body.pageNumber ?? fallbackPage) || fallbackPage,
    pageSize: Number(body.pageSize ?? body.pageSizeValue ?? fallbackPageSize) || fallbackPageSize,
  }
}

export async function getUsers({ page, pageSize, search = '' }) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  const trimmedSearch = search.trim()

  if (trimmedSearch) {
    query.set('search', trimmedSearch)
  }

  const response = await fetch(buildApiUrl(`/api/user?${query.toString()}`), {
    headers: {
      Accept: 'application/json',
    },
  })

  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createUsersError(
      response,
      body,
      'Failed to load users',
      'Unable to load the user list right now.',
    )
  }

  return normalizeUsersPage(body, page, pageSize)
}

export async function updateUser(userId, payload) {
  const response = await fetch(buildApiUrl(`/api/user/${userId}`), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createUsersError(
      response,
      body,
      'Failed to save user',
      'Unable to update the selected user right now.',
    )
  }

  return body
}
