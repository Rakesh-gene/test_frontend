import { requestJson } from './http'
import type { LoginRequest, LoginResponse } from '../types/auth'

function normalizeLoginPayload(credentials: LoginRequest): LoginRequest {
  return {
    email: credentials.email.trim(),
    password: credentials.password,
  }
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: normalizeLoginPayload(credentials),
    fallbackTitle: 'Login failed',
    fallbackDetail: 'Unable to sign you in right now.',
  })
}
