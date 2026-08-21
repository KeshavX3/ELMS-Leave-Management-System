import React, { useEffect, useState } from "react";
import api from "../api";
import DataTable from "../components/DataTable";

function LeaveBalances() {
  const [balances, setBalances] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedEmployee, setSelectedEmployee] =
    useState("");

  const loadEmployees = async () => {
    try {
      const response =
        await api.get("/employees");

      setEmployees(response.data);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load employees."
      );
    }
  };

  const loadBalances = async (employeeId) => {
    if (!employeeId) {
      setBalances([]);
      return;
    }

    try {
      const response =
        await api.get(
          `/leave-balances/employee/${employeeId}`
        );

      setBalances(response.data);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load leave balances."
      );
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;

    setSelectedEmployee(employeeId);

    loadBalances(employeeId);
  };

  const columns = [
    {
      key: "leaveTypeName",
      label: "Leave Type",
    },

    {
      key: "allocatedDays",
      label: "Allocated",
    },

    {
      key: "usedDays",
      label: "Used",
    },

    {
      key: "remainingDays",
      label: "Remaining",
    },

    {
      key: "year",
      label: "Year",
    },
  ];

  const tableData = balances.map(
    (balance) => ({
      id: balance.id,

      leaveTypeName:
        balance.leaveType?.name ||
        "Unknown",

      allocatedDays:
        balance.allocatedDays,

      usedDays:
        balance.usedDays,

      remainingDays:
        balance.remainingDays,

      year: balance.year,
    })
  );

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      <h2>Leave Balances</h2>

      <p>
        View employee leave allocation
        and remaining balance.
      </p>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          marginTop: "20px",
          marginBottom: "25px",
          borderRadius: "8px",
        }}
      >
        <label>
          Select Employee:
        </label>

        <select
          value={selectedEmployee}
          onChange={
            handleEmployeeChange
          }
          style={{
            marginLeft: "15px",
            padding: "8px",
            minWidth: "250px",
          }}
        >
          <option value="">
            Select Employee
          </option>

          {employees.map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
            >
              {employee.firstName}{" "}
              {employee.lastName}{" "}
              ({employee.employeeCode})
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <DataTable
          columns={columns}
          data={tableData}
        />
      )}

      {selectedEmployee &&
        balances.length === 0 && (
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <p>
              No leave balances found
              for this employee.
            </p>

            <p>
              Generate balances for this
              employee from the Admin API
              first.
            </p>
          </div>
        )}
    </div>
  );
}

export default LeaveBalances;