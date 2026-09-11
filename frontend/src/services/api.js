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
      throw new Error(
        (data && data.detail) ||
        (data && data.message) ||
        `HTTP Error ${response.status}: ${response.statusText}`
      );
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
      error: error.message || 'Failed to connect to backend',
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
   * Generic GET request helper for future endpoints
   */
  get: (endpoint) => request(endpoint, { method: 'GET' }),

  /**
   * Generic POST request helper for future endpoints
   */
  post: (endpoint, body) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * Generic PUT request helper for future endpoints
   */
  put: (endpoint, body) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  /**
   * Generic DELETE request helper for future endpoints
   */
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
