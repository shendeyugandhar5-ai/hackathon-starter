/**
 * API Service Layer
 * Centralized HTTP client for communicating with the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Generic request wrapper with timing and error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        (data && data.detail) ||
        (data && data.message) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      const err = new Error(errMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return {
      ok: true,
      status: response.status,
      latencyMs,
      data,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      ok: false,
      status: error.status || 0,
      latencyMs,
      error: error.message || 'Failed to connect to backend service',
      data: null,
    };
  }
}

/**
 * API Service Methods
 */
export const api = {
  baseUrl: API_BASE_URL,

  /**
   * Ping root endpoint (GET /)
   */
  getRoot: () => request('/'),

  /**
   * Health check endpoint (GET /api/health)
   */
  getHealth: () => request('/api/health'),

  /**
   * Generic GET request helper
   */
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),

  /**
   * Generic POST request helper
   */
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),

  /**
   * Generic PUT request helper
   */
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),

  /**
   * Generic DELETE request helper
   */
  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
};

export default api;
