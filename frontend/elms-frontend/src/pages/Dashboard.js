import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f1f5f9",
      }}
    >
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Navbar />

        <main style={{ padding: "30px" }}>
          <h2>Dashboard</h2>

          <p>
            Welcome back, <strong>{user?.email}</strong>
          </p>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "30px",
              flexWrap: "wrap",
            }}
          >
            {/* Employees */}
            <Link
              to="/employees"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: "25px",
                  width: "200px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <h3>👥 Employees</h3>
                <p>Manage employees</p>
              </div>
            </Link>

            {/* Departments */}
            <Link
              to="/departments"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: "25px",
                  width: "200px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <h3>🏢 Departments</h3>
                <p>Manage departments</p>
              </div>
            </Link>

            {/* Leave Requests */}
            <div
              style={{
                backgroundColor: "white",
                padding: "25px",
                width: "200px",
                borderRadius: "8px",
                opacity: 0.7,
              }}
            >
              <h3>📋 Leave Requests</h3>
              <p>Coming soon</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;