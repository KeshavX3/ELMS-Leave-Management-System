import React, { useEffect, useRef, useState } from "react";
import api from "../api";

function Navbar() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const name =
    `${user?.firstName || ""} ${
      user?.lastName || ""
    }`.trim() || "Welcome";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [notifications, setNotifications] =
    useState([]);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const notificationRef = useRef(null);

  /* =========================================================
     LOAD NOTIFICATIONS
  ========================================================= */

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const response = await api.get(
        "/notifications"
      );

      setNotifications(response.data || []);
    } catch (error) {
      console.error(
        "NOTIFICATION LOAD ERROR:",
        error
      );

      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(
      loadNotifications,
      30000
    );

    return () =>
      clearInterval(interval);
  }, []);

  /* =========================================================
     CLOSE WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================================================
     UNREAD COUNT
  ========================================================= */

  const unreadCount = notifications.filter(
    (notification) =>
      !notification.isRead
  ).length;

  /* =========================================================
     MARK AS READ
  ========================================================= */

  const markAsRead = async (id) => {
    try {
      await api.put(
        `/notifications/${id}/read`
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        error
      );
    }
  };

  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const markAllAsRead = async () => {
    try {
      await api.put(
        "/notifications/read-all"
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "MARK ALL NOTIFICATIONS ERROR:",
        error
      );
    }
  };

  /* =========================================================
     TIME FORMAT
  ========================================================= */

  const getRelativeTime = (date) => {
    const now = new Date();

    const created = new Date(date);

    const difference =
      Math.floor(
        (now - created) / 1000
      );

    if (difference < 60) {
      return "Just now";
    }

    const minutes = Math.floor(
      difference / 60
    );

    if (minutes < 60) {
      return `${minutes} min${
        minutes !== 1 ? "s" : ""
      } ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hour${
        hours !== 1 ? "s" : ""
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days} day${
        days !== 1 ? "s" : ""
      } ago`;
    }

    return created.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };

  /* =========================================================
     NOTIFICATION ICON
  ========================================================= */

  const getNotificationIcon = (type) => {
    switch (type) {
      case "LeaveApproved":
        return "✓";

      case "LeaveRejected":
        return "×";

      case "LeaveRequest":
        return "◷";

      default:
        return "🔔";
    }
  };

  return (
    <header className="topbar">

      <div className="topbar-greeting">
        <span>
          Employee Leave Management System
        </span>

        <strong>
          Welcome back, {name}
        </strong>
      </div>

      <div className="topbar-actions">

        {/* =================================================
            NOTIFICATION
        ================================================== */}

        <div
          className="navbar-notification-wrapper"
          ref={notificationRef}
        >

          <button
            className={`notification ${
              showNotifications
                ? "notification-active"
                : ""
            }`}
            aria-label="Notifications"
            title="Notifications"
            onClick={() => {
              setShowNotifications(
                (previous) => !previous
              );

              if (!showNotifications) {
                loadNotifications();
              }
            }}
          >

            <span className="notification-bell">
              🔔
            </span>

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}

          </button>

          {/* =================================================
              DROPDOWN
          ================================================== */}

          {showNotifications && (
            <div className="notification-dropdown">

              <div className="notification-dropdown-header">

                <div>
                  <span>
                    Updates
                  </span>

                  <strong>
                    Notifications
                  </strong>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="mark-all-button"
                  >
                    Mark all read
                  </button>
                )}

              </div>

              <div className="notification-dropdown-body">

                {loadingNotifications ? (
                  <div className="notification-state">
                    <div className="notification-spinner">
                      ⟳
                    </div>

                    <p>
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length ===
                  0 ? (
                  <div className="notification-state">

                    <div className="notification-empty-icon">
                      ✓
                    </div>

                    <strong>
                      You're all caught up
                    </strong>

                    <p>
                      No new notifications right
                      now.
                    </p>

                  </div>
                ) : (
                  notifications
                    .slice(0, 8)
                    .map((notification) => (
                      <button
                        key={notification.id}
                        className={`notification-item ${
                          !notification.isRead
                            ? "unread"
                            : ""
                        }`}
                        onClick={() =>
                          markAsRead(
                            notification.id
                          )
                        }
                      >

                        <span
                          className={`notification-item-icon ${
                            notification.type ||
                            ""
                          }`}
                        >
                          {getNotificationIcon(
                            notification.type
                          )}
                        </span>

                        <span className="notification-item-content">

                          <strong>
                            {notification.type ===
                            "LeaveApproved"
                              ? "Leave Approved"
                              : notification.type ===
                                "LeaveRejected"
                              ? "Leave Rejected"
                              : notification.type ===
                                "LeaveRequest"
                              ? "New Leave Request"
                              : "Notification"}
                          </strong>

                          <span>
                            {
                              notification.message
                            }
                          </span>

                          <small>
                            {getRelativeTime(
                              notification.createdAt
                            )}
                          </small>

                        </span>

                        {!notification.isRead && (
                          <span className="notification-unread-dot" />
                        )}

                      </button>
                    ))
                )}

              </div>

              {notifications.length > 8 && (
                <div className="notification-dropdown-footer">
                  Showing latest 8 notifications
                </div>
              )}

            </div>
          )}

        </div>

        {/* =================================================
            AVATAR
        ================================================== */}

        <span className="avatar avatar-top">
          {initials}
        </span>

      </div>

    </header>
  );
}

export default Navbar;