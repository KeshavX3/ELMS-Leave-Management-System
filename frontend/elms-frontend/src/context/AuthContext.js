import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * AuthContext – single source of truth for authentication state.
 *
 * Replaces all scattered `localStorage.getItem("user")` and
 * `localStorage.getItem("token")` calls across the app.
 *
 * Usage:
 *   const { user, token, login, logout } = useAuth();
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise from localStorage so state survives a page refresh.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  /**
   * Call after a successful login API response.
   * @param {object} data – the full response from /api/auth/login
   */
  const login = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setToken(data.token);
    setUser(data);
  }, []);

  /**
   * Clears all auth state and redirects to the login page.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook – throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;
