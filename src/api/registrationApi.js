import { buildApiUrl } from '../config/api.js'

/**
 * @typedef {Object} UserRegistrationRequest
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} UserRegistrationResponse
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} createdAtUtc
 */

/**
 * @typedef {Object} RegistrationApiErrorBody
 * @property {string=} title
 * @property {string=} detail
 * @property {Record<string, string[]>} [errors]
 * @property {number=} status
 */

/**
 * @typedef {Error & {
 *   status?: number,
 *   title?: string,
 *   detail?: string,
 *   errors?: Record<string, string[]>,
 *   body?: unknown,
 * }} RegistrationApiError
 */

const REGISTER_ENDPOINT = '/api/user/register'

/**
 * @param {UserRegistrationRequest} request
 * @returns {Promise<UserRegistrationResponse>}
 */
export async function registerUser(request) {
  const response = await fetch(buildApiUrl(REGISTER_ENDPOINT), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw await createRegistrationApiError(response)
  }

  return response.json()
}

/**
 * @param {Response} response
 * @returns {Promise<RegistrationApiError>}
 */
async function createRegistrationApiError(response) {
  const fallbackMessage = `Registration request failed with status ${response.status}`
  let parsedBody = null

  try {
    parsedBody = await response.json()
  } catch {
    parsedBody = null
  }

  const error = new Error(getErrorMessage(parsedBody, fallbackMessage))

  /** @type {RegistrationApiError} */
  const typedError = error
  typedError.status = response.status
  typedError.body = parsedBody

  if (isRegistrationApiErrorBody(parsedBody)) {
    typedError.title = parsedBody.title
    typedError.detail = parsedBody.detail
    typedError.errors = parsedBody.errors
  }

  return typedError
}

/**
 * @param {unknown} body
 * @returns {body is RegistrationApiErrorBody}
 */
function isRegistrationApiErrorBody(body) {
  return Boolean(body && typeof body === 'object')
}

/**
 * @param {unknown} body
 * @param {string} fallbackMessage
 * @returns {string}
 */
function getErrorMessage(body, fallbackMessage) {
  if (!isRegistrationApiErrorBody(body)) {
    return fallbackMessage
  }

  if (typeof body.detail === 'string' && body.detail.trim()) {
    return body.detail
  }

  if (typeof body.title === 'string' && body.title.trim()) {
    return body.title
  }

  return fallbackMessage
}
