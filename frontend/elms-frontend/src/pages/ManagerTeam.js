import React, { useEffect, useState } from "react";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function ManagerTeam() {
  const [employees, setEmployees] = useState([]);
  const [balances, setBalances] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        teamResponse,
        balanceResponse,
      ] = await Promise.all([
        api.get("/manager/team"),
        api.get("/manager/team-balances"),
      ]);

      setEmployees(teamResponse.data || []);
      setBalances(balanceResponse.data || []);
    } catch (error) {
      console.error(
        "MANAGER TEAM ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load your team."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const getEmployeeTotalRemaining = (
    employeeId
  ) => {
    return balances
      .filter(
        (balance) =>
          balance.employee?.id ===
          employeeId
      )
      .reduce(
        (total, balance) =>
          total +
          Number(
            balance.remainingDays || 0
          ),
        0
      );
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Manager"
        title="My Team"
        description="View employees who report directly to you."
      />

      {loading ? (
        <div className="content-card">
          Loading team...
        </div>
      ) : error ? (
        <div className="content-card">
          <h3>
            Unable to load team
          </h3>

          <p>{error}</p>

          <button
            className="secondary-button"
            onClick={loadTeam}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <section className="content-card">
            <h3 className="section-title">
              Team Members
            </h3>

            <p className="section-subtitle">
              Only employees assigned to you are shown here.
            </p>

            {employees.length === 0 ? (
              <div className="empty-state">
                No employees are currently assigned to you.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee Code</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Leave Remaining</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map(
                      (employee) => (
                        <tr
                          key={employee.id}
                        >
                          <td>
                            <strong>
                              {
                                employee.firstName
                              }{" "}
                              {
                                employee.lastName
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              employee.employeeCode
                            }
                          </td>

                          <td>
                            {employee.email}
                          </td>

                          <td>
                            {
                              employee
                                .department
                                ?.name ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              employee.status
                            }
                          </td>

                          <td>
                            <strong>
                              {getEmployeeTotalRemaining(
                                employee.id
                              )}
                            </strong>{" "}
                            days
                          </td>
                        </tr>
                      )
                    )}
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

export default ManagerTeam;