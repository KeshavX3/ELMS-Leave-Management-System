import { NavLink, useNavigate } from "react-router-dom";

const icon = (name) => <span className="nav-icon" aria-hidden="true">{name}</span>;

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const linksByRole = {
  Employee: [
    ["Dashboard", "/employee-dashboard", "⌂"],
    ["Apply leave", "/apply-leave", "+"],
    ["Holiday Calendar", "/holidays", "📅"]
  ],

Manager: [
  ["Dashboard", "/manager-dashboard", "⌂"],
  ["My Team", "/manager/team", "◉"],
  ["Apply Leave", "/apply-leave", "+"],
  ["Leave Approvals", "/leave-approvals", "✓"],
  ["Holiday Calendar", "/holidays", "📅"]
],


  Admin: [
    ["Dashboard", "/admin-dashboard", "⌂"],
    ["Employees", "/employees", "◉"],
    ["Departments", "/departments", "▦"],
    ["Leave types", "/leave-types", "◌"],
    ["Leave balances", "/leave-balances", "◒"],
    ["Approvals", "/leave-approvals", "✓"],
    ["Holiday Calendar", "/holidays", "📅"]
  ],
  
};

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}` || "U";

  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">L</span><span>leaveflow</span></div>
      <p className="sidebar-label">WORKSPACE</p>
      <nav className="sidebar-nav">
        {(linksByRole[user?.role] || []).map(([label, to, symbol]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>{icon(symbol)}{label}</NavLink>)}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user"><span className="avatar">{initials}</span><div><strong>{user?.firstName || "Account"}</strong><small>{user?.role || "User"}</small></div></div>
        <button className="logout-button" onClick={logout}>Sign out <span>→</span></button>
      </div>
    </aside>
  );
}

export default Sidebar;
