import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Navbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
