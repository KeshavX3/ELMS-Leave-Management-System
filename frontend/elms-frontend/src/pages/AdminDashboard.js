import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function AdminDashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/admin");

      setDashboard(response.data);
    } catch (error) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (error.response?.status === 403) {
        setError(
          "You are not authorized to access the Admin dashboard."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load Admin dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const quickActions = [
    {
      title: "Employees",
      description: "Add, edit and manage employees",
      icon: "👥",
      path: "/employees",
    },
    {
      title: "Departments",
      description: "Manage organizational departments",
      icon: "🏢",
      path: "/departments",
    },
    {
      title: "Leave Types",
      description: "Configure available leave categories",
      icon: "📋",
      path: "/leave-types",
    },
    {
      title: "Leave Balances",
      description: "Review employee leave balances",
      icon: "◴",
      path: "/leave-balances",
    },
    {
      title: "Leave Approvals",
      description: "Review pending leave requests",
      icon: "✓",
      path: "/leave-approvals",
    },
    {
      title: "Holiday Calendar",
      description: "Manage company holidays",
      icon: "📅",
      path: "/holidays",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title={`Welcome, ${
          user?.firstName || "Admin"
        } 👋`}
        description="Here's an overview of your organization and leave management activity."
      />

      {loading ? (
        <div className="content-card dashboard-loading">
          <div className="loading-spinner">⟳</div>
          <h3>Loading dashboard</h3>
          <p>Getting the latest organization data...</p>
        </div>
      ) : error ? (
        <div className="content-card dashboard-error">
          <div className="error-icon">!</div>

          <div>
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={loadDashboard}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =====================================================
              OVERVIEW
          ====================================================== */}

          <section className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon employees-icon">
                  👥
                </span>

                <span className="admin-stat-label">
                  Workforce
                </span>
              </div>

              <div className="admin-stat-value">
                {dashboard?.employees ?? 0}
              </div>

              <div className="admin-stat-description">
                Total employees
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon departments-icon">
                  🏢
                </span>

                <span className="admin-stat-label">
                  Structure
                </span>
              </div>

              <div className="admin-stat-value">
                {dashboard?.departments ?? 0}
              </div>

              <div className="admin-stat-description">
                Active departments
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon leave-icon">
                  📋
                </span>

                <span className="admin-stat-label">
                  Leave Setup
                </span>
              </div>

              <div className="admin-stat-value">
                {dashboard?.leaveTypes ?? 0}
              </div>

              <div className="admin-stat-description">
                Available leave types
              </div>
            </div>

            <div className="admin-stat-card admin-stat-warning">
              <div className="admin-stat-top">
                <span className="admin-stat-icon pending-icon">
                  ◷
                </span>

                <span className="admin-stat-label">
                  Attention
                </span>
              </div>

              <div className="admin-stat-value">
                {dashboard?.pendingRequests ?? 0}
              </div>

              <div className="admin-stat-description">
                Pending approval
              </div>
            </div>
          </section>

          {/* =====================================================
              PENDING REQUESTS
          ====================================================== */}

          {dashboard?.pendingRequests > 0 && (
            <section className="admin-pending-card">
              <div className="admin-pending-icon">
                !
              </div>

              <div className="admin-pending-content">
                <span className="admin-section-eyebrow">
                  Action required
                </span>

                <h3>
                  {dashboard.pendingRequests} leave request
                  {dashboard.pendingRequests !== 1
                    ? "s"
                    : ""}{" "}
                  awaiting approval
                </h3>

                <p>
                  Review pending requests and take action
                  from the leave approval panel.
                </p>
              </div>

              <Link
                to="/leave-approvals"
                className="admin-pending-button"
              >
                Review Requests →
              </Link>
            </section>
          )}

          {/* =====================================================
              QUICK ACTIONS
          ====================================================== */}

          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-section-eyebrow">
                  Workspace
                </span>

                <h2>Quick actions</h2>

                <p>
                  Manage the core areas of your leave
                  management system.
                </p>
              </div>
            </div>

            <div className="admin-actions-grid">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="admin-action-card"
                >
                  <div className="admin-action-icon">
                    {action.icon}
                  </div>

                  <div className="admin-action-content">
                    <h3>{action.title}</h3>

                    <p>
                      {action.description}
                    </p>
                  </div>

                  <span className="admin-action-arrow">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* =====================================================
              SYSTEM OVERVIEW
          ====================================================== */}

          <section className="admin-overview-card">
            <div className="admin-overview-header">
              <div>
                <span className="admin-section-eyebrow">
                  System overview
                </span>

                <h2>Leave management status</h2>
              </div>

              <span className="system-status">
                <span className="system-status-dot" />
                System active
              </span>
            </div>

            <div className="admin-overview-grid">
              <div className="admin-overview-item">
                <span className="overview-icon">
                  👥
                </span>

                <div>
                  <strong>
                    {dashboard?.employees ?? 0}
                  </strong>

                  <span>
                    Employees managed
                  </span>
                </div>
              </div>

              <div className="admin-overview-item">
                <span className="overview-icon">
                  🏢
                </span>

                <div>
                  <strong>
                    {dashboard?.departments ?? 0}
                  </strong>

                  <span>
                    Departments configured
                  </span>
                </div>
              </div>

              <div className="admin-overview-item">
                <span className="overview-icon">
                  📋
                </span>

                <div>
                  <strong>
                    {dashboard?.leaveTypes ?? 0}
                  </strong>

                  <span>
                    Leave categories
                  </span>
                </div>
              </div>

              <div className="admin-overview-item">
                <span className="overview-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    {dashboard?.pendingRequests ?? 0}
                  </strong>

                  <span>
                    Requests needing action
                  </span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

export default AdminDashboard;