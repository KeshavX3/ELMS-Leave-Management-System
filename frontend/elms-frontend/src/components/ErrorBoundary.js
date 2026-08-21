import React from "react";

/**
 * ErrorBoundary – catches any unhandled rendering errors in the subtree
 * and shows a friendly fallback instead of a blank/crashed screen.
 *
 * Wrap the root of your app (or specific subtrees) with this component:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to an error tracking service (e.g. Sentry).
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <span style={styles.icon}>⚠️</span>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              An unexpected error occurred. Please try refreshing the page.
              If the problem persists, contact your administrator.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre style={styles.detail}>
                {this.state.error?.toString()}
              </pre>
            )}
            <button style={styles.button} onClick={this.handleReload}>
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f6fa",
    fontFamily: "Inter, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "48px 40px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  icon: { fontSize: "48px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#1a1a2e", margin: "16px 0 8px" },
  message: { fontSize: "15px", color: "#6b7280", lineHeight: 1.6 },
  detail: {
    marginTop: "16px",
    padding: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#b91c1c",
    textAlign: "left",
    overflowX: "auto",
  },
  button: {
    marginTop: "24px",
    padding: "10px 28px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default ErrorBoundary;
