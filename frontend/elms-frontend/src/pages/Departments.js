import React, { useEffect, useState } from "react";
import api from "../api";
import DataTable from "../components/DataTable";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function Departments() {
  const [departments, setDepartments] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  // ============================================
  // LOAD DEPARTMENTS
  // ============================================

  const loadDepartments = async () => {
    try {
      const response = await api.get("/departments");

      setDepartments(response.data);
    } catch (error) {
      console.error(
        "DEPARTMENT API ERROR:",
        error
      );

      if (error.response) {
        alert(
          `Failed to load departments.\nStatus: ${error.response.status}`
        );
      } else {
        alert(
          "Unable to connect to backend."
        );
      }
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // ============================================
  // FORM CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ============================================
  // RESET FORM
  // ============================================

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });

    setEditingDepartment(null);
    setShowForm(false);
  };

  // ============================================
  // ADD DEPARTMENT
  // ============================================

  const addDepartment = async (e) => {
    e.preventDefault();

    try {
      await api.post("/departments", {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        isActive: true,
      });

      alert(
        "Department added successfully."
      );

      resetForm();

      loadDepartments();
    } catch (error) {
      console.error(
        "CREATE DEPARTMENT ERROR:",
        error
      );

      const message =
        error.response?.data?.message ||
        JSON.stringify(
          error.response?.data
        ) ||
        "Unable to create department.";

      alert(message);
    }
  };

  // ============================================
  // START EDIT
  // ============================================

  const startEdit = (department) => {
    setEditingDepartment(department);

    setFormData({
      name: department.name || "",
      code: department.code || "",
      description:
        department.description || "",
      isActive:
        department.isActive ?? true,
    });

    setShowForm(true);
  };

  // ============================================
  // UPDATE DEPARTMENT
  // ============================================

  const updateDepartment = async (e) => {
    e.preventDefault();

    try {
      await api.put(
        `/departments/${editingDepartment.id}`,
        {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          isActive: formData.isActive,
        }
      );

      alert(
        "Department updated successfully."
      );

      resetForm();

      loadDepartments();
    } catch (error) {
      console.error(
        "UPDATE DEPARTMENT ERROR:",
        error
      );

      const message =
        error.response?.data?.message ||
        JSON.stringify(
          error.response?.data
        ) ||
        "Unable to update department.";

      alert(message);
    }
  };

  // ============================================
  // DEACTIVATE DEPARTMENT
  // ============================================

  const deactivateDepartment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this department?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/departments/${id}`
      );

      alert(
        "Department deactivated successfully."
      );

      loadDepartments();
    } catch (error) {
      console.error(
        "DELETE DEPARTMENT ERROR:",
        error
      );

      const message =
        error.response?.data?.message ||
        JSON.stringify(
          error.response?.data
        ) ||
        "Unable to deactivate department.";

      alert(message);
    }
  };

  // ============================================
  // SEARCH
  // ============================================

  const filteredDepartments =
    departments.filter((department) => {
      const searchText =
        search.toLowerCase();

      return (
        department.name
          ?.toLowerCase()
          .includes(searchText) ||

        department.code
          ?.toLowerCase()
          .includes(searchText) ||

        department.description
          ?.toLowerCase()
          .includes(searchText)
      );
    });

  // ============================================
  // TABLE COLUMNS
  // ============================================

  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "name",
      label: "Department",
    },
    {
      key: "code",
      label: "Code",
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "isActive",
      label: "Status",
    },
  ];

  // ============================================
  // TABLE DATA
  // ============================================

  const tableData =
    filteredDepartments.map(
      (department) => ({
        ...department,

        isActive:
          department.isActive
            ? "Active"
            : "Inactive",
      })
    );

  return (
    <AppShell>
      {/* HEADER */}

      <PageHeader eyebrow="Organisation" title="Departments" description="Create and maintain the teams that shape your organisation." action={<button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="primary-button">
          + Add Department
        </button>} />

      {/* SEARCH */}

      <div className="content-card search-card">
        <input
          type="text"
          placeholder="Search department, code or description..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "10px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* FORM */}

      {showForm && (
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "8px",
            marginBottom: "30px",
          }}
        >
          <h3>
            {editingDepartment
              ? "Edit Department"
              : "Add Department"}
          </h3>

          <form
            onSubmit={
              editingDepartment
                ? updateDepartment
                : addDepartment
            }
          >
            <input
              name="name"
              placeholder="Department Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              name="code"
              placeholder="Department Code"
              value={formData.code}
              onChange={handleChange}
              required
              style={{
                marginLeft: "10px",
              }}
            />

            <br />
            <br />

            <input
              name="description"
              placeholder="Description"
              value={
                formData.description
              }
              onChange={handleChange}
              style={{
                width: "400px",
                padding: "8px",
              }}
            />

            <br />
            <br />

            <button
              type="submit"
              style={{
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              {editingDepartment
                ? "Update Department"
                : "Create Department"}
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

      {/* TABLE */}

      <DataTable
        columns={columns}
        data={tableData}
        actions={(department) => {
          const originalDepartment =
            filteredDepartments.find(
              (d) =>
                d.id === department.id
            );

          return (
            <>
              <button
                onClick={() =>
                  startEdit(
                    originalDepartment
                  )
                }
                style={{
                  marginRight: "8px",
                }}
              >
                Edit
              </button>

              <button
                onClick={() =>
                  deactivateDepartment(
                    department.id
                  )
                }
              >
                Deactivate
              </button>
            </>
          );
        }}
      />

      {filteredDepartments.length ===
        0 && (
        <p
          style={{
            marginTop: "20px",
          }}
        >
          No departments found.
        </p>
      )}
    </AppShell>
  );
}

export default Departments;
