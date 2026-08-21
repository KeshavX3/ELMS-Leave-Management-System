import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function ManagerDashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [dashboard, setDashboard] = useState(null);
  const [team, setTeam] = useState([]);
  const [balances, setBalances] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardResponse,
        teamResponse,
        balanceResponse,
      ] = await Promise.all([
        api.get("/dashboard/manager"),
        api.get("/manager/team"),
        api.get("/manager/team-balances"),
      ]);

      setDashboard(dashboardResponse.data);
      setTeam(teamResponse.data || []);
      setBalances(balanceResponse.data || []);
    } catch (error) {
      console.error(
        "MANAGER DASHBOARD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (error.response?.status === 403) {
        setError(
          "You are not authorized to access the Manager dashboard."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load Manager dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * Convert balance API data into:
   *
   * Employee → total remaining leave
   */
  const employeeBalances = {};

  balances.forEach((balance) => {
    const employeeId = balance.employee?.id;

    if (!employeeId) {
      return;
    }

    if (!employeeBalances[employeeId]) {
      employeeBalances[employeeId] = 0;
    }

    employeeBalances[employeeId] += Number(
      balance.remainingDays || 0
    );
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Manager workspace"
        title={`Welcome, ${
          user?.firstName || "Manager"
        } 👋`}
        description="Monitor your team, review leave requests and keep track of your team's availability."
        action={
          <Link to="/leave-approvals">
            <button className="primary-button">
              Review approvals
            </button>
          </Link>
        }
      />

      {loading ? (
        <div className="content-card dashboard-loading">
          <div className="loading-spinner">⟳</div>

          <h3>Loading team dashboard</h3>

          <p>
            Getting the latest team information...
          </p>
        </div>
      ) : error ? (
        <div className="content-card dashboard-error">
          <div className="error-icon">!</div>

          <div>
            <h3>Unable to load dashboard</h3>

            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={loadData}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =====================================================
              TEAM OVERVIEW
          ====================================================== */}

          <section className="manager-stats-grid">
            <div className="manager-stat-card">
              <div className="manager-stat-top">
                <span className="manager-stat-icon team-icon">
                  👥
                </span>

                <span className="manager-stat-label">
                  My Team
                </span>
              </div>

              <div className="manager-stat-value">
                {dashboard?.teamMembers ??
                  team.length}
              </div>

              <div className="manager-stat-description">
                Employees reporting to you
              </div>
            </div>

            <div className="manager-stat-card manager-stat-warning">
              <div className="manager-stat-top">
                <span className="manager-stat-icon pending-icon">
                  ◷
                </span>

                <span className="manager-stat-label">
                  Attention
                </span>
              </div>

              <div className="manager-stat-value">
                {dashboard?.pendingRequests ?? 0}
              </div>

              <div className="manager-stat-description">
                Leave requests awaiting review
              </div>
            </div>

            <div className="manager-stat-card">
              <div className="manager-stat-top">
                <span className="manager-stat-icon away-icon">
                  🏖
                </span>

                <span className="manager-stat-label">
                  Availability
                </span>
              </div>

              <div className="manager-stat-value">
                {dashboard?.outThisWeek ?? 0}
              </div>

              <div className="manager-stat-description">
                Team members out this week
              </div>
            </div>

            <div className="manager-stat-card">
              <div className="manager-stat-top">
                <span className="manager-stat-icon days-icon">
                  ◴
                </span>

                <span className="manager-stat-label">
                  Leave Usage
                </span>
              </div>

              <div className="manager-stat-value">
                {balances.reduce(
                  (total, item) =>
                    total +
                    Number(item.usedDays || 0),
                  0
                )}
              </div>

              <div className="manager-stat-description">
                Total leave days used by your team
              </div>
            </div>
          </section>

          {/* =====================================================
              PENDING APPROVAL BANNER
          ====================================================== */}

          {(dashboard?.pendingRequests ?? 0) > 0 && (
            <section className="manager-pending-card">
              <div className="manager-pending-icon">
                !
              </div>

              <div className="manager-pending-content">
                <span className="manager-section-eyebrow">
                  Approval required
                </span>

                <h3>
                  {dashboard.pendingRequests} leave request
                  {dashboard.pendingRequests !== 1
                    ? "s"
                    : ""}{" "}
                  waiting for your decision
                </h3>

                <p>
                  Review your team's pending requests
                  before they are processed.
                </p>
              </div>

              <Link
                to="/leave-approvals"
                className="manager-pending-button"
              >
                Review now →
              </Link>
            </section>
          )}

          {/* =====================================================
              MY TEAM
          ====================================================== */}

          <section className="content-card manager-team-card">
            <div className="manager-card-header">
              <div>
                <span className="manager-section-eyebrow">
                  People
                </span>

                <h2>My Team</h2>

                <p>
                  Employees who report directly to you.
                </p>
              </div>

              <Link
                to="/manager/team"
                className="secondary-button manager-view-link"
              >
                View full team →
              </Link>
            </div>

            {team.length === 0 ? (
              <div className="empty-state">
                No employees are assigned to you.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table manager-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Leave Remaining</th>
                    </tr>
                  </thead>

                  <tbody>
                    {team.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div className="manager-employee">
                            <span className="manager-employee-avatar">
                              {(
                                employee.firstName?.[0] ||
                                ""
                              ).toUpperCase()}
                              {(
                                employee.lastName?.[0] ||
                                ""
                              ).toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {employee.firstName}{" "}
                                {employee.lastName}
                              </strong>

                              <small>
                                {employee.email}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="employee-code">
                            {employee.employeeCode}
                          </span>
                        </td>

                        <td>
                          {employee.department?.name ||
                            "-"}
                        </td>

                        <td>
                          <span className="muted-table-text">
                            {employee.email}
                          </span>
                        </td>

                        <td>
                          <span className="leave-remaining">
                            {employeeBalances[
                              employee.id
                            ] ?? 0}
                          </span>{" "}
                          days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =====================================================
              TEAM LEAVE BALANCES
          ====================================================== */}

          <section className="content-card manager-balance-card">
            <div className="manager-card-header">
              <div>
                <span className="manager-section-eyebrow">
                  Leave management
                </span>

                <h2>Team Leave Balances</h2>

                <p>
                  Monitor allocated, used and remaining
                  leave across your team.
                </p>
              </div>
            </div>

            {balances.length === 0 ? (
              <div className="empty-state">
                No leave balance records found.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table manager-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Allocated</th>
                      <th>Used</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>

                  <tbody>
                    {balances.map((balance) => {
                      const allocated =
                        Number(
                          balance.allocatedDays || 0
                        );

                      const remaining =
                        Number(
                          balance.remainingDays || 0
                        );

                      const percentage =
                        allocated > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (remaining /
                                  allocated) *
                                  100
                              )
                            )
                          : 0;

                      return (
                        <tr key={balance.id}>
                          <td>
                            <strong>
                              {
                                balance.employee
                                  ?.firstName
                              }{" "}
                              {
                                balance.employee
                                  ?.lastName
                              }
                            </strong>
                          </td>

                          <td>
                            <span className="leave-type-pill">
                              {
                                balance.leaveType
                                  ?.name
                              }
                            </span>
                          </td>

                          <td>
                            {balance.allocatedDays}
                          </td>

                          <td>
                            {balance.usedDays}
                          </td>

                          <td>
                            <div className="balance-cell">
                              <div className="manager-balance-bar">
                                <span
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>

                              <strong>
                                {balance.remainingDays}
                              </strong>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =====================================================
              APPROVAL ACTION
          ====================================================== */}

          <section className="manager-approval-footer">
            <div>
              <span className="manager-section-eyebrow">
                Manager actions
              </span>

              <h3>
                Ready to review your team's requests?
              </h3>

              <p>
                Approve or reject pending leave requests
                from one place.
              </p>
            </div>

            <Link
              to="/leave-approvals"
              className="primary-button"
            >
              Open Leave Approvals →
            </Link>
          </section>
        </>
      )}
    </AppShell>
  );
}

export default ManagerDashboard;