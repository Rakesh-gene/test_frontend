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

function createApiError(response, body, fallbackTitle, fallbackDetail) {
  const { title, detail, fieldErrors } = extractProblemPayload(body)
  const status = response.status

  return {
    status,
    title: title || fallbackTitle,
    detail: detail || fallbackDetail,
    fieldErrors,
  }
}

function createListError(response, body) {
  if (response.status === 400) {
    return createApiError(
      response,
      body,
      'Unable to load users',
      'The paging request was rejected by the server.',
    )
  }

  return createApiError(
    response,
    body,
    'Unable to load users',
    'The user directory could not be loaded right now.',
  )
}

function createUpdateError(response, body) {
  if (response.status === 400) {
    return createApiError(response, body, 'Please check the highlighted fields', 'One or more values are invalid.')
  }

  if (response.status === 404) {
    return createApiError(
      response,
      body,
      'User not found',
      'The selected user could not be found. Refresh the page and try again.',
    )
  }

  if (response.status === 409) {
    return {
      ...createApiError(response, body, 'Email already in use', 'That email address is already assigned to another user.'),
      fieldErrors: {
        email: 'That email address is already assigned to another user.',
        ...extractProblemPayload(body).fieldErrors,
      },
    }
  }

  return createApiError(
    response,
    body,
    'Update failed',
    'The user profile could not be updated right now.',
  )
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  return text ? { detail: text } : null
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null
  }

  const id = user.id ?? user.userId ?? user.userID

  if (id == null) {
    return null
  }

  return {
    id,
    firstName: typeof user.firstName === 'string' ? user.firstName : '',
    lastName: typeof user.lastName === 'string' ? user.lastName : '',
    email: typeof user.email === 'string' ? user.email : '',
    createdAtUtc: typeof user.createdAtUtc === 'string' ? user.createdAtUtc : '',
    updatedAtUtc: typeof user.updatedAtUtc === 'string' ? user.updatedAtUtc : '',
  }
}

function getArrayValue(body, keys) {
  for (const key of keys) {
    if (Array.isArray(body?.[key])) {
      return body[key]
    }
  }

  return []
}

function getNumberValue(value, fallback) {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function normalizeUserList(body, fallbackPage, fallbackPageSize) {
  const items =
    Array.isArray(body)
      ? body
      : getArrayValue(body, ['items', 'data', 'users', 'results', 'value'])
  const normalizedItems = items.map(normalizeUser).filter(Boolean)

  const totalCount = getNumberValue(
    body?.totalCount ?? body?.totalItems ?? body?.total ?? body?.count ?? body?.pagination?.totalCount,
    normalizedItems.length,
  )
  const page = getNumberValue(body?.page ?? body?.currentPage ?? body?.pagination?.page, fallbackPage)
  const pageSize = getNumberValue(
    body?.pageSize ?? body?.pageSizeRequested ?? body?.pagination?.pageSize,
    fallbackPageSize,
  )

  return {
    items: normalizedItems,
    totalCount,
    page,
    pageSize,
  }
}

function buildPaginationQuery({ page, pageSize }) {
  const searchParams = new URLSearchParams()

  searchParams.set('page', String(page))
  searchParams.set('pageSize', String(pageSize))

  return searchParams.toString()
}

export async function getUsers({ page, pageSize }) {
  const response = await fetch(`${buildApiUrl('/api/user')}?${buildPaginationQuery({ page, pageSize })}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createListError(response, body)
  }

  return normalizeUserList(body, page, pageSize)
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
    throw createUpdateError(response, body)
  }

  return normalizeUser(body)
}

