import React, { useEffect, useState } from "react";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function LeaveApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] =
    useState("");

  const [processingId, setProcessingId] =
    useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/leave-requests/pending"
      );

      setRequests(response.data || []);
    } catch (error) {
      console.error(
        "LEAVE APPROVAL ERROR:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (error.response?.status === 403) {
        setError(
          "You are not authorized to manage leave approvals."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Unable to load pending leave requests."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const approveRequest = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this leave request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(id);

      await api.put(
        `/leave-requests/${id}/approve`
      );

      alert(
        "Leave request approved successfully."
      );

      await loadRequests();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to approve leave request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (id) => {
    if (!rejectionReason.trim()) {
      alert(
        "Please provide a reason for rejecting this request."
      );

      return;
    }

    try {
      setProcessingId(id);

      await api.put(
        `/leave-requests/${id}/reject`,
        {
          rejectionReason:
            rejectionReason.trim(),
        }
      );

      alert(
        "Leave request rejected successfully."
      );

      setRejectingId(null);
      setRejectionReason("");

      await loadRequests();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to reject leave request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getInitials = (employee) => {
    const first =
      employee?.firstName?.[0] || "";

    const last =
      employee?.lastName?.[0] || "";

    return `${first}${last}`.toUpperCase();
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Manager workspace"
        title="Leave Approvals"
        description="Review pending leave requests from your team and make approval decisions."
      />

      {/* =====================================================
          TOP SUMMARY
      ====================================================== */}

      {!loading &&
        !error &&
        requests.length > 0 && (
          <section className="approval-summary">

            <div className="approval-summary-main">
              <div className="approval-summary-icon">
                ◷
              </div>

              <div>
                <span>
                  Awaiting your decision
                </span>

                <strong>
                  {requests.length}
                </strong>

                <small>
                  pending leave request
                  {requests.length !== 1
                    ? "s"
                    : ""}
                </small>
              </div>
            </div>

            <div className="approval-summary-note">
              <strong>
                Review each request carefully
              </strong>

              <p>
                Check the employee, leave dates,
                available duration and reason before
                approving or rejecting.
              </p>
            </div>

          </section>
        )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="content-card approval-loading">
          <div className="loading-spinner">
            ⟳
          </div>

          <h3>
            Loading pending requests
          </h3>

          <p>
            Getting the latest requests from your
            team...
          </p>
        </div>
      ) : error ? (
        /* ===================================================
           ERROR
        ==================================================== */

        <div className="content-card approval-error">
          <div className="approval-error-icon">
            !
          </div>

          <div>
            <h3>
              Unable to load requests
            </h3>

            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={loadRequests}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : requests.length === 0 ? (
        /* ===================================================
           EMPTY
        ==================================================== */

        <div className="content-card approval-empty">
          <div className="approval-empty-icon">
            ✓
          </div>

          <span className="approval-section-eyebrow">
            All caught up
          </span>

          <h3>
            No pending leave requests
          </h3>

          <p>
            Your team currently has no leave requests
            waiting for approval.
          </p>
        </div>
      ) : (
        /* ===================================================
           REQUEST LIST
        ==================================================== */

        <div className="approval-request-list">

          {requests.map((request) => {
            const isProcessing =
              processingId === request.id;

            const isRejecting =
              rejectingId === request.id;

            return (
              <article
                className="approval-request-card"
                key={request.id}
              >

                {/* REQUEST HEADER */}

                <div className="approval-request-header">

                  <div className="approval-employee">

                    <div className="approval-avatar">
                      {getInitials(
                        request.employee
                      )}
                    </div>

                    <div>
                      <span className="approval-section-eyebrow">
                        Employee
                      </span>

                      <h2>
                        {
                          request.employee
                            ?.firstName
                        }{" "}
                        {
                          request.employee
                            ?.lastName
                        }
                      </h2>

                      <p>
                        {
                          request.employee
                            ?.employeeCode
                        }

                        {request.employee?.email
                          ? ` • ${request.employee.email}`
                          : ""}
                      </p>
                    </div>

                  </div>

                  <span className="status-pill status-pending">
                    Pending
                  </span>

                </div>

                {/* REQUEST DETAILS */}

                <div className="approval-details-grid">

                  <div className="approval-detail">
                    <span>
                      Leave type
                    </span>

                    <strong>
                      {
                        request.leaveType
                          ?.name
                      }
                    </strong>

                    {request.leaveType?.code && (
                      <small>
                        {
                          request.leaveType
                            .code
                        }
                      </small>
                    )}
                  </div>

                  <div className="approval-detail">
                    <span>
                      From
                    </span>

                    <strong>
                      {formatDate(
                        request.fromDate
                      )}
                    </strong>
                  </div>

                  <div className="approval-detail">
                    <span>
                      To
                    </span>

                    <strong>
                      {formatDate(
                        request.toDate
                      )}
                    </strong>
                  </div>

                  <div className="approval-detail approval-days">
                    <span>
                      Duration
                    </span>

                    <strong>
                      {request.totalDays}
                    </strong>

                    <small>
                      working day
                      {request.totalDays !== 1
                        ? "s"
                        : ""}
                    </small>
                  </div>

                </div>

                {/* REASON */}

                <div className="approval-reason">
                  <div className="approval-reason-label">
                    <span>
                      Employee reason
                    </span>
                  </div>

                  <p>
                    {request.reason ||
                      "No reason provided."}
                  </p>
                </div>

                {/* REJECTION FORM */}

                {isRejecting ? (
                  <div className="approval-rejection-box">

                    <div className="approval-rejection-header">
                      <div>
                        <span className="approval-section-eyebrow">
                          Reject request
                        </span>

                        <strong>
                          Why are you rejecting
                          this leave?
                        </strong>
                      </div>

                      <span>
                        Required
                      </span>
                    </div>

                    <textarea
                      rows="4"
                      placeholder="Enter a clear reason that the employee can understand..."
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(
                          event.target.value
                        )
                      }
                      disabled={isProcessing}
                    />

                    <div className="approval-form-actions">

                      <button
                        className="secondary-button"
                        disabled={isProcessing}
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        className="approval-confirm-reject"
                        disabled={isProcessing}
                        onClick={() =>
                          rejectRequest(
                            request.id
                          )
                        }
                      >
                        {isProcessing
                          ? "Rejecting..."
                          : "Confirm rejection"}
                      </button>

                    </div>

                  </div>
                ) : (
                  /* ACTIONS */

                  <div className="approval-actions">

                    <div className="approval-action-note">
                      <span>
                        Request #{request.id}
                      </span>

                      <small>
                        Applied{" "}
                        {formatDate(
                          request.appliedAt
                        )}
                      </small>
                    </div>

                    <div className="approval-action-buttons">

                      <button
                        className="approval-reject-button"
                        disabled={isProcessing}
                        onClick={() => {
                          setRejectingId(
                            request.id
                          );
                          setRejectionReason("");
                        }}
                      >
                        Reject
                      </button>

                      <button
                        className="approval-approve-button"
                        disabled={isProcessing}
                        onClick={() =>
                          approveRequest(
                            request.id
                          )
                        }
                      >
                        {isProcessing
                          ? "Processing..."
                          : "✓ Approve"}
                      </button>

                    </div>

                  </div>
                )}

              </article>
            );
          })}

        </div>
      )}
    </AppShell>
  );
}

export default LeaveApprovals;