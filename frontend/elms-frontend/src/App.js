import {
  HashRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import LeaveTypes from "./pages/LeaveTypes";
import LeaveBalances from "./pages/LeaveBalances";
import ApplyLeave from "./pages/ApplyLeave";
import LeaveApprovals from "./pages/LeaveApprovals";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerTeam from "./pages/ManagerTeam";
import HolidayCalendar from "./pages/HolidayCalendar";

/**
 * Redirects to the role-specific dashboard after login.
 * Reads from AuthContext — no localStorage.
 */
function RoleHome() {
  const { user } = useAuth();
  const destinations = {
    Employee: "/employee-dashboard",
    Manager:  "/manager-dashboard",
    Admin:    "/admin-dashboard",
  };
  return <Navigate to={destinations[user?.role] || "/"} replace />;
}

/**
 * NOTE: Each page component already wraps itself with <AppShell>
 * (Sidebar + Navbar). Do NOT add <AppShell> here in the routes —
 * it would cause a double sidebar/navbar.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────── */}
      <Route path="/" element={<Login />} />

      {/* ── Auth redirect ──────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleHome />
          </ProtectedRoute>
        }
      />

      {/* ── Admin routes ───────────────────────────────────── */}
      <Route
        path="/admin-dashboard"
        element={
          <RoleRoute allowedRoles={["Admin"]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <RoleRoute allowedRoles={["Admin"]}>
            <Employees />
          </RoleRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <RoleRoute allowedRoles={["Admin"]}>
            <Departments />
          </RoleRoute>
        }
      />
      <Route
        path="/leave-types"
        element={
          <RoleRoute allowedRoles={["Admin"]}>
            <LeaveTypes />
          </RoleRoute>
        }
      />
      <Route
        path="/leave-balances"
        element={
          <RoleRoute allowedRoles={["Admin"]}>
            <LeaveBalances />
          </RoleRoute>
        }
      />

      {/* ── Manager routes ─────────────────────────────────── */}
      <Route
        path="/manager-dashboard"
        element={
          <RoleRoute allowedRoles={["Manager"]}>
            <ManagerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/manager/team"
        element={
          <RoleRoute allowedRoles={["Manager"]}>
            <ManagerTeam />
          </RoleRoute>
        }
      />

      {/* ── Employee routes ────────────────────────────────── */}
      <Route
        path="/employee-dashboard"
        element={
          <RoleRoute allowedRoles={["Employee"]}>
            <EmployeeDashboard />
          </RoleRoute>
        }
      />

      {/* ── Shared routes (multiple roles) ─────────────────── */}
      <Route
  path="/apply-leave"
  element={
    <RoleRoute allowedRoles={["Employee", "Manager", "Admin"]}>
      <ApplyLeave />
    </RoleRoute>
  }
/>
      <Route
        path="/leave-approvals"
        element={
          <RoleRoute allowedRoles={["Admin", "Manager"]}>
            <LeaveApprovals />
          </RoleRoute>
        }
      />
      <Route
        path="/holidays"
        element={
          <RoleRoute allowedRoles={["Admin", "Manager", "Employee"]}>
            <HolidayCalendar />
          </RoleRoute>
        }
      />

      {/* ── Fallback: redirect to role dashboard ───────────── */}
      <Route path="*" element={<RoleHome />} />
    </Routes>
  );
}

function App() {
  return (
    // ErrorBoundary catches unhandled render errors globally.
    <ErrorBoundary>
      {/* AuthProvider makes user/token/login/logout available everywhere. */}
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
