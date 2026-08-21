import React, { useEffect, useState } from "react";
import api from "../api";
import DataTable from "../components/DataTable";

function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [editingLeaveType, setEditingLeaveType] =
    useState(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    defaultDays: "",
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  });

  // ============================================
  // LOAD
  // ============================================

  const loadLeaveTypes = async () => {
    try {
      const response =
        await api.get("/leave-types");

      setLeaveTypes(response.data);
    } catch (error) {
      console.error(
        "LEAVE TYPE ERROR:",
        error
      );

      alert(
        "Unable to load leave types."
      );
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  // ============================================
  // CHANGE
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  // ============================================
  // RESET
  // ============================================

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      defaultDays: "",
      isPaid: true,
      requiresApproval: true,
      isActive: true,
    });

    setEditingLeaveType(null);
    setShowForm(false);
  };

  // ============================================
  // CREATE
  // ============================================

  const createLeaveType = async (e) => {
    e.preventDefault();

    try {
      await api.post("/leave-types", {
        name: formData.name,
        code: formData.code,
        description:
          formData.description,

        defaultDays:
          Number(formData.defaultDays),

        isPaid:
          formData.isPaid,

        requiresApproval:
          formData.requiresApproval,

        isActive: true,
      });

      alert(
        "Leave type created successfully."
      );

      resetForm();

      loadLeaveTypes();
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Unable to create leave type.";

      alert(message);
    }
  };

  // ============================================
  // EDIT
  // ============================================

  const startEdit = (leaveType) => {
    setEditingLeaveType(leaveType);

    setFormData({
      name: leaveType.name || "",
      code: leaveType.code || "",
      description:
        leaveType.description || "",

      defaultDays:
        leaveType.defaultDays ?? "",

      isPaid:
        leaveType.isPaid ?? true,

      requiresApproval:
        leaveType.requiresApproval ?? true,

      isActive:
        leaveType.isActive ?? true,
    });

    setShowForm(true);
  };

  // ============================================
  // UPDATE
  // ============================================

  const updateLeaveType = async (e) => {
    e.preventDefault();

    try {
      await api.put(
        `/leave-types/${editingLeaveType.id}`,
        {
          name: formData.name,
          code: formData.code,

          description:
            formData.description,

          defaultDays:
            Number(formData.defaultDays),

          isPaid:
            formData.isPaid,

          requiresApproval:
            formData.requiresApproval,

          isActive:
            formData.isActive,
        }
      );

      alert(
        "Leave type updated successfully."
      );

      resetForm();

      loadLeaveTypes();
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Unable to update leave type.";

      alert(message);
    }
  };

  // ============================================
  // DEACTIVATE
  // ============================================

  const deactivateLeaveType = async (
    id
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this leave type?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/leave-types/${id}`
      );

      alert(
        "Leave type deactivated successfully."
      );

      loadLeaveTypes();
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Unable to deactivate leave type.";

      alert(message);
    }
  };

  // ============================================
  // SEARCH
  // ============================================

  const filteredLeaveTypes =
    leaveTypes.filter((leaveType) => {
      const text =
        search.toLowerCase();

      return (
        leaveType.name
          ?.toLowerCase()
          .includes(text) ||

        leaveType.code
          ?.toLowerCase()
          .includes(text) ||

        leaveType.description
          ?.toLowerCase()
          .includes(text)
      );
    });

  // ============================================
  // TABLE
  // ============================================

  const tableData =
    filteredLeaveTypes.map(
      (leaveType) => ({
        ...leaveType,

        paidStatus:
          leaveType.isPaid
            ? "Paid"
            : "Unpaid",

        approvalStatus:
          leaveType.requiresApproval
            ? "Required"
            : "Not Required",

        status:
          leaveType.isActive
            ? "Active"
            : "Inactive",
      })
    );

  const columns = [
    {
      key: "name",
      label: "Leave Type",
    },

    {
      key: "code",
      label: "Code",
    },

    {
      key: "defaultDays",
      label: "Default Days",
    },

    {
      key: "paidStatus",
      label: "Paid",
    },

    {
      key: "approvalStatus",
      label: "Approval",
    },

    {
      key: "status",
      label: "Status",
    },
  ];

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h2>Leave Types</h2>

          <p>
            Configure organization
            leave policies.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Leave Type
        </button>
      </div>

      {/* SEARCH */}

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          marginBottom: "20px",
          borderRadius: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Search leave type..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "10px",
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
            {editingLeaveType
              ? "Edit Leave Type"
              : "Add Leave Type"}
          </h3>

          <form
            onSubmit={
              editingLeaveType
                ? updateLeaveType
                : createLeaveType
            }
          >
            <input
              name="name"
              placeholder="Leave Type Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              name="code"
              placeholder="Code"
              value={formData.code}
              onChange={handleChange}
              required
              style={{
                marginLeft: "10px",
              }}
            />

            <input
              type="number"
              name="defaultDays"
              placeholder="Default Days"
              value={
                formData.defaultDays
              }
              onChange={handleChange}
              min="0"
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

            <label>
              <input
                type="checkbox"
                name="isPaid"
                checked={
                  formData.isPaid
                }
                onChange={handleChange}
              />

              {" "}Paid Leave
            </label>

            <br />

            <label>
              <input
                type="checkbox"
                name="requiresApproval"
                checked={
                  formData.requiresApproval
                }
                onChange={handleChange}
              />

              {" "}Requires Approval
            </label>

            <br />
            <br />

            <button
              type="submit"
            >
              {editingLeaveType
                ? "Update Leave Type"
                : "Create Leave Type"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              style={{
                marginLeft: "10px",
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
        actions={(leaveType) => {
          const original =
            filteredLeaveTypes.find(
              (l) =>
                l.id === leaveType.id
            );

          return (
            <>
              <button
                onClick={() =>
                  startEdit(original)
                }
                style={{
                  marginRight: "8px",
                }}
              >
                Edit
              </button>

              <button
                onClick={() =>
                  deactivateLeaveType(
                    leaveType.id
                  )
                }
              >
                Deactivate
              </button>
            </>
          );
        }}
      />
    </div>
  );
}

export default LeaveTypes;