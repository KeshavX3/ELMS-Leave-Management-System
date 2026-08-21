import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { useAuth } from "./context/AuthContext";

/**
 * Login page.
 *
 * - Uses the shared `api` instance (no hardcoded URL here).
 * - Calls `login()` from AuthContext on success so all components
 *   see the updated auth state immediately.
 */
function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      // Persist to context (which also writes to localStorage).
      login(res.data);

      const destinations = {
        Employee: "/employee-dashboard",
        Manager:  "/manager-dashboard",
        Admin:    "/admin-dashboard",
      };

      navigate(destinations[res.data.role] || "/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't sign you in. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left branding panel ── */}
      <section className="login-aside">
        <div className="brand">
          <span className="brand-mark">L</span>
          <span>leaveflow</span>
        </div>
        <div>
          <h1>Time away, made simple.</h1>
          <p>
            A calmer way for teams to plan, request and approve leave —
            all in one place.
          </p>
        </div>
        <small>EMPLOYEE LEAVE MANAGEMENT SYSTEM</small>
      </section>

      {/* ── Right login panel ── */}
      <main className="login-panel">
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in to your account</h2>
        <p>Enter your details to access your workspace.</p>

        <form onSubmit={handleSubmit}>
          <label className="field">
            Work email
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            Password
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p style={{ margin: 0, color: "#b34b3c", fontSize: "13px" }}>
              {error}
            </p>
          )}

          <button
            id="login-submit"
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className="login-note">Use your organisation-provided credentials.</p>
      </main>
    </div>
  );
}

export default Login;
