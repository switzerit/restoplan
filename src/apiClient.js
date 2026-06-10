const API_URL = 'https://api.varman.ch'

function getTokens() {
  return {
    access: localStorage.getItem('varman_access_token'),
    refresh: localStorage.getItem('varman_refresh_token')
  }
}

function setTokens(access, refresh) {
  localStorage.setItem('varman_access_token', access)
  if (refresh) localStorage.setItem('varman_refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('varman_access_token')
  localStorage.removeItem('varman_refresh_token')
}

async function refreshAccessToken() {
  const { refresh } = getTokens()
  if (!refresh) return null
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh })
  })
  if (!res.ok) { clearTokens(); return null }
  const data = await res.json()
  setTokens(data.access, data.refresh)
  return data.access
}

async function apiFetch(path, options = {}) {
  let { access } = getTokens()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(options.headers || {})
    }
  })
  if (res.status === 401) {
    access = await refreshAccessToken()
    if (!access) { window.location.href = '/login'; return null }
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
        ...(options.headers || {})
      }
    })
  }
  return res
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.access) setTokens(data.access, data.refresh)
    return data
  },
  logout() { clearTokens() },
  getTokens,
  setTokens,
  clearTokens,

  // Generic
  async get(path) {
    const res = await apiFetch(path)
    return res?.json()
  },
  async post(path, body) {
    const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
    return res?.json()
  },
  async put(path, body) {
    const res = await apiFetch(path, { method: 'PUT', body: JSON.stringify(body) })
    return res?.json()
  },
  async delete(path) {
    const res = await apiFetch(path, { method: 'DELETE' })
    return res?.json()
  }
}
