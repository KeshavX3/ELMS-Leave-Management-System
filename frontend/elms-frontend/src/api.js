import axios from "axios";

/**
 * Shared Axios instance for all API calls.
 *
 * - Automatically attaches the JWT Bearer token from localStorage.
 * - On 401 (token expired / invalid), clears auth state and
 *   redirects to the login page so the user is never stuck in a
 *   broken authenticated state.
 */
const api = axios.create({
  baseURL: "https://localhost:7014/api",
});

// ── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 (expired / invalid token) ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials so the app doesn't loop on stale state.
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login (only if not already there).
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;