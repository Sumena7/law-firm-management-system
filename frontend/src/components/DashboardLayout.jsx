import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import DashboardStats from "./DashboardStats"; 
import "../App.css";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
    window.location.reload();
  };

  // This matches the ".active-link a" rule in your App.css
  const getNavClass = (path) => location.pathname === path ? "active-link" : "";

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>JusticePanel</h2>
          <p>Legal Admin System</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className={getNavClass("/cases")}>
              <Link to="/cases">📂 Cases</Link>
            </li>
            <li className={getNavClass("/clients")}>
              <Link to="/clients">👥 Clients</Link>
            </li>
            <li className={getNavClass("/lawyers")}>
              <Link to="/lawyers">⚖️ Lawyers</Link>
            </li>
            <li className={getNavClass("/appointments")}>
              <Link to="/appointments">📅 Appointments</Link>
            </li>
            <li className={getNavClass("/invoices")}>
              <Link to="/invoices">💳 Billing & Invoices</Link>
            </li>
            <li className={getNavClass("/documents")}>
              <Link to="/documents">📄 Documents</Link>
            </li>

            {isAdmin && (
              <li className={getNavClass("/admin/users")}>
                <Link to="/admin/users">🛡️ Manage Users</Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div style={{ padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>
            Logged in as: <span style={{ color: '#fff', textTransform: 'capitalize' }}>{user.role}</span>
          </div>
          <button className="btn danger" onClick={handleLogout} style={{width: '100%'}}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <DashboardStats /> 
        <div className="container">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;