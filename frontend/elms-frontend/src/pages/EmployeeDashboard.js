import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function EmployeeDashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [balanceResponse, requestResponse] =
        await Promise.all([
          api.get("/leave-balances/my"),
          api.get("/leave-requests/my"),
        ]);

      setBalances(balanceResponse.data || []);
      setRequests(requestResponse.data || []);
    } catch (error) {
      console.error(
        "EMPLOYEE DASHBOARD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "Your session has expired. Please sign out and log in again."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load your leave information."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cancelRequest = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/leave-requests/${id}`);

      alert("Leave request cancelled successfully.");

      loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to cancel leave request."
      );
    }
  };

  /* =========================================================
     TOTALS
  ========================================================= */

  const totals = balances.reduce(
    (total, balance) => ({
      allocated:
        total.allocated +
        Number(balance.allocatedDays || 0),

      used:
        total.used +
        Number(balance.usedDays || 0),

      remaining:
        total.remaining +
        Number(balance.remainingDays || 0),
    }),
    {
      allocated: 0,
      used: 0,
      remaining: 0,
    }
  );

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const cancelledCount = requests.filter(
    (request) => request.status === "Cancelled"
  ).length;

  const getStatusClass = (status) => {
    if (status === "Approved") {
      return "status-pill status-approved";
    }

    if (status === "Rejected") {
      return "status-pill status-rejected";
    }

    if (status === "Cancelled") {
      return "status-pill status-cancelled";
    }

    return "status-pill status-pending";
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Employee workspace"
        title={`Hello, ${
          user?.firstName || "there"
        } 👋`}
        description="Keep track of your leave balance, requests and approval status."
        action={
          <Link
            to="/apply-leave"
            className="employee-apply-button"
          >
            + Apply for leave
          </Link>
        }
      />

      {loading ? (
        <div className="content-card dashboard-loading">
          <div className="loading-spinner">⟳</div>

          <h3>Loading your dashboard</h3>

          <p>
            Getting your latest leave information...
          </p>
        </div>
      ) : error ? (
        <div className="content-card dashboard-error">
          <div className="error-icon">!</div>

          <div>
            <h3>Unable to load your dashboard</h3>

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
              LEAVE OVERVIEW
          ====================================================== */}

          <section className="employee-summary-grid">
            <div className="employee-summary-card employee-summary-main">
              <div className="employee-summary-icon">
                ◴
              </div>

              <div>
                <span className="employee-summary-label">
                  Available leave
                </span>

                <strong>
                  {totals.remaining}
                </strong>

                <small>
                  days remaining
                </small>
              </div>
            </div>

            <div className="employee-summary-card">
              <span className="employee-summary-label">
                Total allocated
              </span>

              <strong>
                {totals.allocated}
              </strong>

              <small>
                days assigned this year
              </small>
            </div>

            <div className="employee-summary-card">
              <span className="employee-summary-label">
                Days used
              </span>

              <strong>
                {totals.used}
              </strong>

              <small>
                approved leave taken
              </small>
            </div>

            <div className="employee-summary-card employee-summary-pending">
              <span className="employee-summary-label">
                Pending requests
              </span>

              <strong>
                {pendingCount}
              </strong>

              <small>
                waiting for approval
              </small>
            </div>
          </section>

          {/* =====================================================
              IMPORTANT STATUS
          ====================================================== */}

          {pendingCount > 0 && (
            <section className="employee-pending-banner">
              <div className="employee-pending-icon">
                ◷
              </div>

              <div>
                <span>
                  Request awaiting approval
                </span>

                <strong>
                  You have {pendingCount} leave request
                  {pendingCount !== 1
                    ? "s"
                    : ""}{" "}
                  waiting for your manager.
                </strong>

                <small>
                  You can track the status from your
                  leave history below.
                </small>
              </div>
            </section>
          )}

          {/* =====================================================
              LEAVE BALANCES
          ====================================================== */}

          <section className="content-card employee-balance-card">
            <div className="employee-section-header">
              <div>
                <span className="employee-section-eyebrow">
                  Your allowance
                </span>

                <h2>Leave Balance</h2>

                <p>
                  See how many days are available for
                  each leave type.
                </p>
              </div>

              <Link
                to="/apply-leave"
                className="secondary-button"
              >
                Apply for leave →
              </Link>
            </div>

            {balances.length === 0 ? (
              <div className="empty-state">
                No leave balances are available yet.
              </div>
            ) : (
              <div className="employee-balance-grid">
                {balances.map((balance) => {
                  const allocated = Number(
                    balance.allocatedDays || 0
                  );

                  const remaining = Number(
                    balance.remainingDays || 0
                  );

                  const used = Number(
                    balance.usedDays || 0
                  );

                  const percentage =
                    allocated > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (remaining / allocated) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div
                      className="employee-balance-item"
                      key={balance.id}
                    >
                      <div className="employee-balance-top">
                        <div>
                          <strong>
                            {balance.leaveType?.name ||
                              "Leave"}
                          </strong>

                          <span>
                            {balance.leaveType?.code ||
                              ""}
                          </span>
                        </div>

                        <strong className="employee-days-left">
                          {remaining}
                          <small> left</small>
                        </strong>
                      </div>

                      <div className="employee-progress">
                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <div className="employee-balance-meta">
                        <span>
                          {used} used
                        </span>

                        <span>
                          {allocated} allocated
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =====================================================
              REQUEST SUMMARY
          ====================================================== */}

          <section className="employee-request-summary">
            <div className="employee-request-stat">
              <span className="request-stat-icon approved">
                ✓
              </span>

              <div>
                <strong>
                  {approvedCount}
                </strong>

                <span>
                  Approved
                </span>
              </div>
            </div>

            <div className="employee-request-stat">
              <span className="request-stat-icon pending">
                ◷
              </span>

              <div>
                <strong>
                  {pendingCount}
                </strong>

                <span>
                  Pending
                </span>
              </div>
            </div>

            <div className="employee-request-stat">
              <span className="request-stat-icon rejected">
                ×
              </span>

              <div>
                <strong>
                  {rejectedCount}
                </strong>

                <span>
                  Rejected
                </span>
              </div>
            </div>

            <div className="employee-request-stat">
              <span className="request-stat-icon total">
                #
              </span>

              <div>
                <strong>
                  {requests.length}
                </strong>

                <span>
                  Total requests
                </span>
              </div>
            </div>
          </section>

          {/* =====================================================
              LEAVE HISTORY
          ====================================================== */}

          <section className="content-card employee-history-card">
            <div className="employee-section-header">
              <div>
                <span className="employee-section-eyebrow">
                  Your activity
                </span>

                <h2>My Leave History</h2>

                <p>
                  Track every leave request and its
                  current approval status.
                </p>
              </div>

              <Link
                to="/apply-leave"
                className="primary-button"
              >
                + New request
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="employee-empty-history">
                <div className="employee-empty-icon">
                  📋
                </div>

                <h3>
                  No leave requests yet
                </h3>

                <p>
                  When you submit a leave request,
                  you'll be able to track it here.
                </p>

                <Link
                  to="/apply-leave"
                  className="primary-button"
                >
                  Apply for your first leave
                </Link>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table employee-history-table">
                  <thead>
                    <tr>
                      <th>Leave</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <div className="employee-history-type">
                            <strong>
                              {request.leaveType
                                ?.name ||
                                "Leave"}
                            </strong>

                            <small>
                              {request.leaveType
                                ?.code || ""}
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="employee-date-range">
                            <strong>
                              {new Date(
                                request.fromDate
                              ).toLocaleDateString()}
                            </strong>

                            <span>to</span>

                            <strong>
                              {new Date(
                                request.toDate
                              ).toLocaleDateString()}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {request.totalDays}
                          </strong>
                        </td>

                        <td>
                          <span className="employee-reason">
                            {request.reason}
                          </span>
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              request.status
                            )}
                          >
                            {request.status}
                          </span>

                          {request.status ===
                            "Rejected" &&
                            request.rejectionReason && (
                              <div className="employee-rejection">
                                {request.rejectionReason}
                              </div>
                            )}
                        </td>

                        <td>
                          {request.status ===
                            "Pending" && (
                            <button
                              className="employee-cancel-button"
                              onClick={() =>
                                cancelRequest(
                                  request.id
                                )
                              }
                            >
                              Cancel
                            </button>
                          )}

                          {request.status ===
                            "Approved" && (
                            <span className="employee-action-approved">
                              ✓ Approved
                            </span>
                          )}

                          {request.status ===
                            "Rejected" && (
                            <span className="employee-action-rejected">
                              Rejected
                            </span>
                          )}

                          {request.status ===
                            "Cancelled" && (
                            <span className="employee-action-cancelled">
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

export default EmployeeDashboard;