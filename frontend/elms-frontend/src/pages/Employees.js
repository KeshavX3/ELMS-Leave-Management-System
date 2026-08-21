import React, { useEffect, useState } from "react";
import api from "../api";
import DataTable from "../components/DataTable";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    passwordHash: "",
    dateOfBirth: "",
    joiningDate: "",
    gender: "",
    departmentId: "",
    managerId: "",
    role: "Employee",
    status: "Active",
    profileImageUrl: "",
  });

  // =========================
  // LOAD EMPLOYEES
  // =========================

  const loadEmployees = async () => {
    try {
      const response = await api.get("/employees");

      setEmployees(response.data);
    } catch (error) {
      console.error("EMPLOYEE API ERROR:", error);

      if (error.response) {
        alert(
          `Failed to load employees.\nStatus: ${error.response.status}`
        );
      } else {
        alert("Unable to connect to backend.");
      }
    }
  };

  // =========================
  // LOAD DEPARTMENTS
  // =========================

  const loadDepartments = async () => {
    try {
      const response = await api.get("/departments");

      setDepartments(response.data);
    } catch (error) {
      console.error("DEPARTMENT API ERROR:", error);

      alert("Unable to load departments.");
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setFormData({
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      passwordHash: "",
      dateOfBirth: "",
      joiningDate: "",
      gender: "",
      departmentId: "",
      managerId: "",
      role: "Employee",
      status: "Active",
      profileImageUrl: "",
    });

    setEditingEmployee(null);
    setShowForm(false);
  };

  // =========================
  // ADD EMPLOYEE
  // =========================

  const addEmployee = async (e) => {
    e.preventDefault();

    try {
      const employeeData = {
        employeeCode: formData.employeeCode,

        firstName: formData.firstName,

        lastName: formData.lastName,

        email: formData.email,

        phoneNumber: formData.phoneNumber,

        passwordHash: formData.passwordHash,

        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : null,

        joiningDate: formData.joiningDate
          ? new Date(formData.joiningDate).toISOString()
          : new Date().toISOString(),

        gender: formData.gender,

        departmentId: formData.departmentId
          ? Number(formData.departmentId)
          : null,

        managerId: formData.managerId
          ? Number(formData.managerId)
          : null,

        role: formData.role,

        status: formData.status,

        profileImageUrl: formData.profileImageUrl || null,
      };

      await api.post("/employees", employeeData);

      alert("Employee added successfully.");

      resetForm();

      loadEmployees();
    } catch (error) {
      console.error("CREATE EMPLOYEE ERROR:", error);

      console.error(
        "UPDATE EMPLOYEE ERROR:",
        error
      );

      if (error.response) {
        console.log(
          "Status:",
          error.response.status
        );

        console.log(
          "Response:",
          error.response.data
        );

        const message =
          error.response.data?.message ||
          JSON.stringify(error.response.data);

        alert(message);
      } else {
        alert("Unable to connect to backend.");
      }
    }
  };

  // =========================
  // START EDIT
  // =========================

  const startEdit = (employee) => {
    setEditingEmployee(employee);

    setFormData({
      employeeCode: employee.employeeCode || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phoneNumber: employee.phoneNumber || "",
      passwordHash: "",
      dateOfBirth: employee.dateOfBirth
        ? employee.dateOfBirth.substring(0, 10)
        : "",
      joiningDate: employee.joiningDate
        ? employee.joiningDate.substring(0, 10)
        : "",
      gender: employee.gender || "",
      departmentId: employee.department?.id || "",
      managerId: employee.manager?.id || "",
      role: employee.role || "Employee",
      status: employee.status || "Active",
      profileImageUrl: employee.profileImageUrl || "",
    });

    setShowForm(true);
  };

  // =========================
  // UPDATE EMPLOYEE
  // =========================

  const updateEmployee = async (e) => {
    e.preventDefault();

    try {
      const employeeData = {
        ...formData,

        departmentId: formData.departmentId
          ? Number(formData.departmentId)
          : null,

        managerId: formData.managerId
          ? Number(formData.managerId)
          : null,

        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : null,

        joiningDate: formData.joiningDate
          ? new Date(formData.joiningDate).toISOString()
          : new Date().toISOString(),
      };

      await api.put(
        `/employees/${editingEmployee.id}`,
        employeeData
      );

      alert("Employee updated successfully.");

      resetForm();

      loadEmployees();
    } catch (error) {
      console.error("UPDATE EMPLOYEE ERROR:", error);

      alert(
        error.response?.data ||
        "Unable to update employee."
      );
    }
  };

  // =========================
  // DEACTIVATE EMPLOYEE
  // =========================

  const deactivateEmployee = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);

      alert("Employee deactivated successfully.");

      loadEmployees();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data ||
        "Unable to deactivate employee."
      );
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase();

    return (
      employee.employeeCode
        ?.toLowerCase()
        .includes(searchText) ||

      employee.firstName
        ?.toLowerCase()
        .includes(searchText) ||

      employee.lastName
        ?.toLowerCase()
        .includes(searchText) ||

      employee.email
        ?.toLowerCase()
        .includes(searchText) ||

      employee.role
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  const availableManagers = employees.filter(
    (employee) =>
      employee.role === "Manager" &&
      employee.id !== editingEmployee?.id
  );

  // =========================
  // TABLE COLUMNS
  // =========================

  const columns = [
    {
      key: "employeeCode",
      label: "Employee Code",
    },
    {
      key: "firstName",
      label: "First Name",
    },
    {
      key: "lastName",
      label: "Last Name",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Role",
    },
    {
      key: "status",
      label: "Status",
    },
  ];

  return (
    <AppShell>
      {/* HEADER */}

      <PageHeader eyebrow="People" title="Employees" description="Manage organisation members, roles and access." action={<button
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
        style={{
          padding: "10px 18px",
          cursor: "pointer",
        }}
        className="primary-button">
        + Add Employee
      </button>} />

      {/* SEARCH */}

      <div className="content-card search-card">
        <input
          type="text"
          placeholder="Search by name, email, code or role..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* FORM */}

      {showForm && (
        <div className="form-card">
          <h3>
            {editingEmployee
              ? "Edit Employee"
              : "Add Employee"}
          </h3>

          <form className="form-grid"
            onSubmit={
              editingEmployee
                ? updateEmployee
                : addEmployee
            }
          >
            <input
              name="employeeCode"
              placeholder="Employee Code"
              value={formData.employeeCode}
              onChange={handleChange}
              required
            />

            <input
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              style={{
                marginLeft: "10px",
              }}
            />

            <input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              style={{
                marginLeft: "10px",
              }}
            />

            <br />
            <br />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              style={{
                marginLeft: "10px",
              }}
            />

            {!editingEmployee && (
              <input
                type="password"
                name="passwordHash"
                placeholder="Temporary Password"
                value={formData.passwordHash}
                onChange={handleChange}
                required
                style={{
                  marginLeft: "10px",
                }}
              />
            )}

            <br />
            <br />

            <label>
              Date of Birth:
            </label>

            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              style={{
                marginLeft: "10px",
              }}
            />

            <label
              style={{
                marginLeft: "20px",
              }}
            >
              Joining Date:
            </label>

            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              style={{
                marginLeft: "10px",
              }}
            />

            <br />
            <br />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">
                Select Gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              required
              style={{
                marginLeft: "10px",
              }}
            >
              <option value="">
                Select Department
              </option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>

            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              style={{
                marginLeft: "10px",
              }}
            >
              <option value="">
                No Reporting Manager
              </option>

              {availableManagers.map((manager) => (
                <option
                  key={manager.id}
                  value={manager.id}
                >
                  {manager.firstName} {manager.lastName} ({manager.employeeCode})
                </option>
              ))}
            </select>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                marginLeft: "10px",
              }}
            >
              <option value="Employee">
                Employee
              </option>

              <option value="Manager">
                Manager
              </option>

              <option value="Admin">
                Admin
              </option>
            </select>

            <br />
            <br />

            <button
              type="submit"
              style={{
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              {editingEmployee
                ? "Update Employee"
                : "Create Employee"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "10px 20px",
                marginLeft: "10px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* EMPLOYEE TABLE */}

      <DataTable
        columns={columns}
        data={filteredEmployees}
        actions={(employee) => (
          <>
            <button
              onClick={() =>
                startEdit(employee)
              }
              style={{
                marginRight: "8px",
              }}
            >
              Edit
            </button>

            <button
              onClick={() =>
                deactivateEmployee(
                  employee.id
                )
              }
            >
              Deactivate
            </button>
          </>
        )}
      />

      {filteredEmployees.length === 0 && (
        <p
          style={{
            marginTop: "20px",
          }}
        >
          No employees found.
        </p>
      )}
    </AppShell>
  );
}

export default Employees;
