import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import FeedbackDialog from "../components/FeedbackDialog";

function ApplyLeave() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isAdmin = user?.role === "Admin";

  // =========================================================
  // DATA
  // =========================================================

  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  // =========================================================
  // FEEDBACK DIALOG
  // =========================================================

  const [dialog, setDialog] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "Okay",
    onConfirm: null,
  });

  const showDialog = ({
    type = "success",
    title,
    message,
    confirmText = "Okay",
    onConfirm = null,
  }) => {
    setDialog({
      open: true,
      type,
      title,
      message,
      confirmText,
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialog((previous) => ({
      ...previous,
      open: false,
      onConfirm: null,
    }));
  };

  // =========================================================
  // FORM
  // =========================================================

  const [formData, setFormData] = useState({
    employeeId: "",
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const leaveTypesResponse =
          await api.get("/leave-types");

        setLeaveTypes(
          leaveTypesResponse.data || []
        );

        if (isAdmin) {
          const employeesResponse =
            await api.get("/employees");

          setEmployees(
            employeesResponse.data || []
          );
        } else {
          const balanceResponse =
            await api.get("/leave-balances/my");

          setBalances(
            balanceResponse.data || []
          );
        }
      } catch (error) {
        console.error(
          "LOAD LEAVE DATA ERROR:",
          error
        );

        showDialog({
          type: "error",
          title: "Unable to load leave data",
          message:
            error.response?.data?.message ||
            "Unable to load leave application data.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAdmin]);

  // =========================================================
  // SELECTED BALANCE
  // =========================================================

  const selectedBalance = balances.find(
    (balance) =>
      Number(balance.leaveTypeId) ===
      Number(formData.leaveTypeId)
  );

  // =========================================================
  // UPDATE FORM FIELD
  // =========================================================

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // SUBMIT LEAVE
  // =========================================================

  const submitLeave = async (event) => {
    event.preventDefault();

    // ---------------------------------------------------------
    // DATE VALIDATION
    // ---------------------------------------------------------

    if (
      formData.fromDate &&
      formData.toDate &&
      formData.fromDate > formData.toDate
    ) {
      showDialog({
        type: "warning",
        title: "Invalid date range",
        message:
          "The From date cannot be after the To date.",
      });

      return;
    }

    // ---------------------------------------------------------
    // START SUBMITTING
    // ---------------------------------------------------------

    setSubmitting(true);

    try {
      const payload = {
        leaveTypeId:
          Number(formData.leaveTypeId),

        fromDate:
          formData.fromDate,

        toDate:
          formData.toDate,

        reason:
          formData.reason.trim(),
      };

      // -------------------------------------------------------
      // ADMIN CAN SUBMIT FOR AN EMPLOYEE
      // -------------------------------------------------------

      if (isAdmin) {
        payload.employeeId =
          Number(formData.employeeId);
      }

      // -------------------------------------------------------
      // API REQUEST
      // -------------------------------------------------------

      const response =
        await api.post(
          "/leave-requests",
          payload
        );

      // -------------------------------------------------------
      // SUCCESS DIALOG
      // -------------------------------------------------------
      console.log("🔥 SHOWING SUCCESS DIALOG");
      console.log("Response:", response.data);
      
      showDialog({
        type: "success",
        title: "Leave Request Submitted",
        message:
          `${response.data.message}\n\n` +
          `Working days: ${response.data.totalDays}`,
        confirmText: "Continue",

        onConfirm: () => {
          closeDialog();

          navigate(
            isAdmin
              ? "/admin-dashboard"
              : "/employee-dashboard"
          );
        },
      });
    } catch (error) {
      console.error(
        "APPLY LEAVE ERROR:",
        error
      );

      // -------------------------------------------------------
      // ERROR DIALOG
      // -------------------------------------------------------

      showDialog({
        type: "error",
        title: "Leave Request Failed",
        message:
          error.response?.data?.message ||
          "Unable to submit leave request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // BALANCE PERCENTAGE
  // =========================================================

  const getBalancePercentage = (balance) => {
    const allocated =
      Number(
        balance.allocatedDays || 0
      );

    const remaining =
      Number(
        balance.remainingDays || 0
      );

    if (allocated <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (remaining / allocated) * 100
      )
    );
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        eyebrow="Leave management"
        title={
          isAdmin
            ? "Submit leave request"
            : "Apply for leave"
        }
        description={
          isAdmin
            ? "Submit a leave request on behalf of an employee."
            : "Plan your time away and submit a leave request for approval."
        }
      />

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="content-card apply-leave-loading">

          <div className="loading-spinner">
            ⟳
          </div>

          <h3>
            Preparing leave application
          </h3>

          <p>
            Loading leave types and available
            information...
          </p>

        </div>
      ) : (

        <div className="apply-leave-layout">

          {/* =================================================
              FORM
          ================================================== */}

          <section className="content-card apply-leave-form-card">

            {/* FORM HEADER */}

            <div className="apply-leave-card-header">

              <div className="apply-leave-header-icon">
                📋
              </div>

              <div>

                <span className="apply-section-eyebrow">
                  New request
                </span>

                <h2>
                  Leave details
                </h2>

                <p>
                  Fill in the details below to submit
                  your leave request.
                </p>

              </div>

            </div>

            {/* FORM */}

            <form onSubmit={submitLeave}>

              {/* =========================================
                  ADMIN EMPLOYEE
              ========================================== */}

              {isAdmin && (
                <label className="apply-field">

                  <span>
                    Employee
                    <b>*</b>
                  </span>

                  <select
                    required
                    value={formData.employeeId}
                    onChange={(event) =>
                      updateField(
                        "employeeId",
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.firstName}{" "}
                          {employee.lastName}{" "}
                          ({employee.employeeCode})
                        </option>
                      )
                    )}

                  </select>

                </label>
              )}

              {/* =========================================
                  LEAVE TYPE
              ========================================== */}

              <label className="apply-field">

                <span>
                  Leave type
                  <b>*</b>
                </span>

                <select
                  required
                  value={formData.leaveTypeId}
                  onChange={(event) =>
                    updateField(
                      "leaveTypeId",
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select leave type
                  </option>

                  {leaveTypes.map(
                    (leaveType) => (
                      <option
                        key={leaveType.id}
                        value={leaveType.id}
                      >
                        {leaveType.name} (
                        {leaveType.code})
                      </option>
                    )
                  )}

                </select>

              </label>

              {/* =========================================
                  SELECTED BALANCE
              ========================================== */}

              {selectedBalance &&
                !isAdmin && (

                  <div className="selected-leave-balance">

                    <div className="selected-balance-icon">
                      ◴
                    </div>

                    <div className="selected-balance-info">

                      <span>
                        Available balance
                      </span>

                      <strong>
                        {
                          selectedBalance
                            .leaveType?.name
                        }
                      </strong>

                    </div>

                    <div className="selected-balance-days">

                      <strong>
                        {
                          selectedBalance
                            .remainingDays
                        }
                      </strong>

                      <span>
                        days left
                      </span>

                    </div>

                  </div>
                )}

              {/* =========================================
                  DATES
              ========================================== */}

              <div className="apply-date-section">

                <div className="apply-date-heading">

                  <span>
                    Leave period
                  </span>

                  <small>
                    Select the first and last day
                  </small>

                </div>

                <div className="apply-date-grid">

                  {/* FROM DATE */}

                  <label className="apply-field">

                    <span>
                      From date
                      <b>*</b>
                    </span>

                    <input
                      required
                      type="date"
                      value={
                        formData.fromDate
                      }
                      onChange={(event) =>
                        updateField(
                          "fromDate",
                          event.target.value
                        )
                      }
                    />

                  </label>

                  {/* TO DATE */}

                  <label className="apply-field">

                    <span>
                      To date
                      <b>*</b>
                    </span>

                    <input
                      required
                      type="date"
                      value={
                        formData.toDate
                      }
                      min={
                        formData.fromDate ||
                        undefined
                      }
                      onChange={(event) =>
                        updateField(
                          "toDate",
                          event.target.value
                        )
                      }
                    />

                  </label>

                </div>

              </div>

              {/* =========================================
                  REASON
              ========================================== */}

              <label className="apply-field">

                <span>
                  Reason
                  <b>*</b>
                </span>

                <textarea
                  required
                  rows="5"
                  placeholder="Briefly explain the reason for your leave..."
                  value={
                    formData.reason
                  }
                  onChange={(event) =>
                    updateField(
                      "reason",
                      event.target.value
                    )
                  }
                />

                <small className="apply-field-hint">
                  Keep your reason clear and concise.
                </small>

              </label>

              {/* =========================================
                  ACTIONS
              ========================================== */}

              <div className="apply-form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    navigate(
                      isAdmin
                        ? "/admin-dashboard"
                        : "/employee-dashboard"
                    )
                  }
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  className="primary-button apply-submit-button"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit leave request →"}
                </button>

              </div>

            </form>

          </section>

          {/* =================================================
              EMPLOYEE BALANCES
          ================================================== */}

          {!isAdmin && (

            <aside className="apply-balance-sidebar">

              <section className="content-card">

                <div className="apply-sidebar-header">

                  <div>

                    <span className="apply-section-eyebrow">
                      Your allowance
                    </span>

                    <h2>
                      Leave balances
                    </h2>

                    <p>
                      Your current available
                      leave.
                    </p>

                  </div>

                  <div className="apply-sidebar-icon">
                    ◴
                  </div>

                </div>

                {/* NO BALANCES */}

                {balances.length === 0 ? (

                  <div className="empty-state">
                    No balances available.
                  </div>

                ) : (

                  <div className="apply-balance-list">

                    {balances.map(
                      (balance) => {

                        const percentage =
                          getBalancePercentage(
                            balance
                          );

                        return (

                          <div
                            key={balance.id}
                            className="apply-balance-item"
                          >

                            <div className="apply-balance-top">

                              <div>

                                <strong>
                                  {
                                    balance
                                      .leaveType
                                      ?.name
                                  }
                                </strong>

                                <span>
                                  {
                                    balance
                                      .leaveType
                                      ?.code
                                  }
                                </span>

                              </div>

                              <strong className="apply-balance-number">
                                {
                                  balance.remainingDays
                                }
                              </strong>

                            </div>

                            <div className="apply-balance-progress">

                              <span
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                            <div className="apply-balance-footer">

                              <span>
                                {
                                  balance.usedDays
                                }{" "}
                                used
                              </span>

                              <span>
                                {
                                  balance
                                    .allocatedDays
                                }{" "}
                                allocated
                              </span>

                            </div>

                          </div>

                        );
                      }
                    )}

                  </div>
                )}

              </section>

              {/* =========================================
                  HELPFUL INFO
              ========================================== */}

              <section className="apply-info-card">

                <div className="apply-info-icon">
                  💡
                </div>

                <div>

                  <strong>
                    Before you submit
                  </strong>

                  <p>
                    Make sure your dates are correct
                    and that you have enough leave
                    balance available.
                  </p>

                </div>

              </section>

            </aside>
          )}

          {/* =================================================
              ADMIN SIDE PANEL
          ================================================== */}

          {isAdmin && (

            <aside className="apply-admin-info">

              <div className="apply-admin-info-icon">
                🛡
              </div>

              <span className="apply-section-eyebrow">
                Administrator
              </span>

              <h3>
                Submitting on behalf of an employee
              </h3>

              <p>
                Select the employee first, then
                choose their leave type and dates.
                The request will be created in the
                selected employee's account.
              </p>

            </aside>
          )}

        </div>
      )}

      {/* =====================================================
          GLOBAL FEEDBACK DIALOG
      ====================================================== */}

      <FeedbackDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        onConfirm={
          dialog.onConfirm || closeDialog
        }
        onClose={closeDialog}
      />

    </AppShell>
  );
}

export default ApplyLeave;