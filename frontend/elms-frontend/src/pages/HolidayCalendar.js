import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

function HolidayCalendar() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    date: "",
    isOptional: false,
    isCompanyHoliday: true,
  });

  /* =========================================================
     LOAD HOLIDAYS
  ========================================================= */

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/holidays");

      setHolidays(response.data || []);
    } catch (error) {
      console.error(
        "HOLIDAY LOAD ERROR:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load holidays."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  /* =========================================================
     FORM
  ========================================================= */

  const resetForm = () => {
    setForm({
      name: "",
      date: "",
      isOptional: false,
      isCompanyHoliday: true,
    });

    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      name: "",
      date: "",
      isOptional: false,
      isCompanyHoliday: true,
    });

    setShowForm(true);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =========================================================
     ADD / UPDATE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter a holiday name.");
      return;
    }

    if (!form.date) {
      alert("Please select a date.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        date: form.date,
        isOptional: form.isOptional,
        isCompanyHoliday: true,
      };

      if (editingId) {
        await api.put(
          `/holidays/${editingId}`,
          payload
        );

        alert(
          "Company holiday updated successfully."
        );
      } else {
        await api.post(
          "/holidays",
          payload
        );

        alert(
          "Company holiday added successfully."
        );
      }

      resetForm();

      await loadHolidays();
    } catch (error) {
      console.error(
        "HOLIDAY SAVE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to save company holiday."
      );
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (holiday) => {
    if (!holiday.isCompanyHoliday) {
      alert(
        "Public holidays cannot be edited."
      );

      return;
    }

    setEditingId(holiday.id);

    setForm({
      name: holiday.name || "",
      date: holiday.date
        ? holiday.date.substring(0, 10)
        : "",
      isOptional:
        holiday.isOptional || false,
      isCompanyHoliday: true,
    });

    setShowForm(true);
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (holiday) => {
    if (!holiday.isCompanyHoliday) {
      alert(
        "Public holidays cannot be deleted."
      );

      return;
    }

    const confirmed = window.confirm(
      `Delete "${holiday.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/holidays/${holiday.id}`
      );

      alert(
        "Company holiday deleted successfully."
      );

      await loadHolidays();
    } catch (error) {
      console.error(
        "HOLIDAY DELETE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to delete holiday."
      );
    }
  };

  /* =========================================================
     DATA
  ========================================================= */

  const sortedHolidays = useMemo(
    () =>
      [...holidays].sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      ),
    [holidays]
  );

  const currentYear =
    new Date().getFullYear();

  const upcomingHolidays = sortedHolidays
    .filter(
      (holiday) =>
        new Date(holiday.date) >=
        new Date(
          new Date().setHours(
            0,
            0,
            0,
            0
          )
        )
    )
    .slice(0, 5);

  const companyHolidayCount =
    holidays.filter(
      (holiday) =>
        holiday.isCompanyHoliday
    ).length;

  const publicHolidayCount =
    holidays.filter(
      (holiday) =>
        !holiday.isCompanyHoliday
    ).length;

  const optionalCount =
    holidays.filter(
      (holiday) =>
        holiday.isOptional
    ).length;

  /* =========================================================
     CALENDAR
  ========================================================= */

  const [selectedMonth, setSelectedMonth] =
    useState(new Date().getMonth());

  const [selectedYear, setSelectedYear] =
    useState(currentYear);

  const monthStart = new Date(
    selectedYear,
    selectedMonth,
    1
  );

  const firstDay =
    monthStart.getDay();

  const daysInMonth = new Date(
    selectedYear,
    selectedMonth + 1,
    0
  ).getDate();

  const calendarCells = [];

  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarCells.push(day);
  }

  const holidaysForMonth =
    sortedHolidays.filter((holiday) => {
      const date = new Date(
        holiday.date
      );

      return (
        date.getFullYear() ===
          selectedYear &&
        date.getMonth() ===
          selectedMonth
      );
    });

  const getHolidayForDay = (day) => {
    return holidaysForMonth.find(
      (holiday) =>
        new Date(
          holiday.date
        ).getDate() === day
    );
  };

  const monthName =
    monthStart.toLocaleDateString(
      "en-IN",
      {
        month: "long",
      }
    );

  const goPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(
        selectedYear - 1
      );
    } else {
      setSelectedMonth(
        selectedMonth - 1
      );
    }
  };

  const goNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(
        selectedYear + 1
      );
    } else {
      setSelectedMonth(
        selectedMonth + 1
      );
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Company calendar"
        title="Holiday Calendar"
        description={
          isAdmin
            ? "View public holidays and manage company holidays."
            : "View public and company holidays for the year."
        }
        action={
          isAdmin ? (
            <button
              className="primary-button holiday-add-button"
              onClick={openAddForm}
            >
              + Add Company Holiday
            </button>
          ) : null
        }
      />

      {/* =====================================================
          QUICK STATS
      ====================================================== */}

      <section className="holiday-stat-grid">

        <div className="holiday-stat-card holiday-stat-total">
          <div className="holiday-stat-icon">
            📅
          </div>

          <div>
            <span>
              Total holidays
            </span>

            <strong>
              {holidays.length}
            </strong>

            <small>
              {selectedYear} calendar
            </small>
          </div>
        </div>

        <div className="holiday-stat-card">
          <div className="holiday-stat-icon company">
            🏢
          </div>

          <div>
            <span>
              Company holidays
            </span>

            <strong>
              {companyHolidayCount}
            </strong>

            <small>
              Managed by admin
            </small>
          </div>
        </div>

        <div className="holiday-stat-card">
          <div className="holiday-stat-icon public">
            🇮🇳
          </div>

          <div>
            <span>
              Public holidays
            </span>

            <strong>
              {publicHolidayCount}
            </strong>

            <small>
              System holidays
            </small>
          </div>
        </div>

        <div className="holiday-stat-card">
          <div className="holiday-stat-icon optional">
            ✦
          </div>

          <div>
            <span>
              Optional
            </span>

            <strong>
              {optionalCount}
            </strong>

            <small>
              Optional days
            </small>
          </div>
        </div>

      </section>

      {/* =====================================================
          ADMIN FORM
      ====================================================== */}

      {isAdmin && showForm && (
        <section className="content-card holiday-form-card">

          <div className="holiday-form-header">
            <div className="holiday-form-icon">
              {editingId ? "✎" : "+"}
            </div>

            <div>
              <span className="holiday-eyebrow">
                Administrator
              </span>

              <h2>
                {editingId
                  ? "Edit Company Holiday"
                  : "Add Company Holiday"}
              </h2>

              <p>
                Add a company-specific holiday
                to the shared calendar.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="holiday-form"
          >

            <label className="holiday-field">
              <span>
                Holiday name
                <b>*</b>
              </span>

              <input
                type="text"
                name="name"
                placeholder="Example: Company Foundation Day"
                value={form.name}
                onChange={handleChange}
              />
            </label>

            <label className="holiday-field">
              <span>
                Date
                <b>*</b>
              </span>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </label>

            <label className="holiday-optional-toggle">
              <input
                type="checkbox"
                name="isOptional"
                checked={form.isOptional}
                onChange={handleChange}
              />

              <span>
                <strong>
                  Optional holiday
                </strong>

                <small>
                  Employees may choose whether
                  to take this day.
                </small>
              </span>
            </label>

            <div className="holiday-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {editingId
                  ? "Update Holiday"
                  : "Add Holiday"}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* =====================================================
          CALENDAR + UPCOMING
      ====================================================== */}

      <section className="holiday-main-grid">

        {/* CALENDAR */}

        <div className="content-card holiday-calendar-card">

          <div className="holiday-calendar-header">

            <div>
              <span className="holiday-eyebrow">
                {selectedYear}
              </span>

              <h2>
                {monthName}
              </h2>

              <p>
                Company and public holidays
                highlighted below.
              </p>
            </div>

            <div className="holiday-month-controls">
              <button
                onClick={goPreviousMonth}
                aria-label="Previous month"
              >
                ‹
              </button>

              <button
                onClick={goNextMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

          </div>

          <div className="holiday-weekdays">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <div key={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="holiday-calendar-grid">

            {calendarCells.map(
              (day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="holiday-calendar-day empty"
                    />
                  );
                }

                const holiday =
                  getHolidayForDay(day);

                const isToday =
                  day ===
                    new Date().getDate() &&
                  selectedMonth ===
                    new Date().getMonth() &&
                  selectedYear ===
                    new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`holiday-calendar-day ${
                      holiday
                        ? "has-holiday"
                        : ""
                    } ${
                      isToday
                        ? "today"
                        : ""
                    }`}
                    title={
                      holiday
                        ? holiday.name
                        : ""
                    }
                  >
                    <span className="holiday-day-number">
                      {day}
                    </span>

                    {holiday && (
                      <div
                        className={`holiday-day-marker ${
                          holiday.isCompanyHoliday
                            ? "company"
                            : "public"
                        }`}
                      >
                        <span>
                          {holiday.isCompanyHoliday
                            ? "🏢"
                            : "🇮🇳"}
                        </span>

                        <small>
                          {holiday.name}
                        </small>
                      </div>
                    )}
                  </div>
                );
              }
            )}

          </div>

          <div className="holiday-legend">

            <span>
              <i className="legend-dot company" />
              Company holiday
            </span>

            <span>
              <i className="legend-dot public" />
              Public holiday
            </span>

            <span>
              <i className="legend-dot optional" />
              Optional
            </span>

          </div>

        </div>

        {/* UPCOMING */}

        <aside className="content-card upcoming-holidays-card">

          <div className="upcoming-header">
            <div>
              <span className="holiday-eyebrow">
                Coming up
              </span>

              <h2>
                Upcoming Holidays
              </h2>

              <p>
                The next holidays on your
                calendar.
              </p>
            </div>

            <span className="upcoming-count">
              {upcomingHolidays.length}
            </span>
          </div>

          {upcomingHolidays.length === 0 ? (
            <div className="holiday-empty-small">
              No upcoming holidays.
            </div>
          ) : (
            <div className="upcoming-list">

              {upcomingHolidays.map(
                (holiday) => (
                  <div
                    key={holiday.id}
                    className="upcoming-item"
                  >

                    <div
                      className={`upcoming-date ${
                        holiday.isCompanyHoliday
                          ? "company"
                          : "public"
                      }`}
                    >
                      <strong>
                        {new Date(
                          holiday.date
                        ).getDate()}
                      </strong>

                      <span>
                        {new Date(
                          holiday.date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                          }
                        )}
                      </span>
                    </div>

                    <div className="upcoming-info">

                      <strong>
                        {holiday.name}
                      </strong>

                      <div>
                        <span
                          className={`holiday-type-tag ${
                            holiday.isCompanyHoliday
                              ? "company"
                              : "public"
                          }`}
                        >
                          {holiday.isCompanyHoliday
                            ? "Company"
                            : "Public"}
                        </span>

                        {holiday.isOptional && (
                          <span className="holiday-type-tag optional">
                            Optional
                          </span>
                        )}
                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </aside>

      </section>

      {/* =====================================================
          ALL HOLIDAYS
      ====================================================== */}

      <section className="content-card all-holidays-card">

        <div className="all-holidays-header">

          <div>
            <span className="holiday-eyebrow">
              Complete list
            </span>

            <h2>
              All Holidays
            </h2>

            <p>
              Public and company holidays
              available in the system.
            </p>
          </div>

          <span className="holiday-count-label">
            {holidays.length}{" "}
            {holidays.length === 1
              ? "holiday"
              : "holidays"}
          </span>

        </div>

        {loading ? (
          <div className="holiday-empty-state">
            Loading holidays...
          </div>
        ) : error ? (
          <div className="holiday-empty-state">

            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={loadHolidays}
            >
              Try Again
            </button>

          </div>
        ) : sortedHolidays.length === 0 ? (
          <div className="holiday-empty-state">
            <div>
              📅
            </div>

            <h3>
              No holidays available
            </h3>

            <p>
              Holidays added to the system will
              appear here.
            </p>
          </div>
        ) : (
          <div className="holiday-list">

            {sortedHolidays.map(
              (holiday) => (
                <div
                  key={holiday.id}
                  className="holiday-list-item"
                >

                  <div
                    className={`holiday-list-date ${
                      holiday.isCompanyHoliday
                        ? "company"
                        : "public"
                    }`}
                  >
                    <strong>
                      {new Date(
                        holiday.date
                      ).getDate()}
                    </strong>

                    <span>
                      {new Date(
                        holiday.date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          month: "short",
                        }
                      )}
                    </span>
                  </div>

                  <div className="holiday-list-info">

                    <strong>
                      {holiday.name}
                    </strong>

                    <span>
                      {formatDate(
                        holiday.date
                      )}
                    </span>

                  </div>

                  <div className="holiday-list-tags">

                    <span
                      className={`holiday-type-tag ${
                        holiday.isCompanyHoliday
                          ? "company"
                          : "public"
                      }`}
                    >
                      {holiday.isCompanyHoliday
                        ? "🏢 Company"
                        : "🇮🇳 Public"}
                    </span>

                    <span
                      className={`holiday-type-tag ${
                        holiday.isOptional
                          ? "optional"
                          : "mandatory"
                      }`}
                    >
                      {holiday.isOptional
                        ? "Optional"
                        : "Mandatory"}
                    </span>

                  </div>

                  {isAdmin &&
                    holiday.isCompanyHoliday && (
                      <div className="holiday-list-actions">

                        <button
                          className="holiday-edit-button"
                          onClick={() =>
                            handleEdit(
                              holiday
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="holiday-delete-button"
                          onClick={() =>
                            handleDelete(
                              holiday
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>
                    )}

                  {isAdmin &&
                    !holiday.isCompanyHoliday && (
                      <span className="holiday-system-label">
                        System holiday
                      </span>
                    )}

                </div>
              )
            )}

          </div>
        )}

      </section>
    </AppShell>
  );
}

export default HolidayCalendar;