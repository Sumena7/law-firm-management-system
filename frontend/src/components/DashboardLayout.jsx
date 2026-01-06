import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import AppointmentNotification from "./AppointmentNotification"; 
import "../App.css";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin' || user.role === 'staff';

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
    window.location.reload();
  };

  return (
    <div className="dashboard-wrapper">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>JusticePanel</h2>
          <p>Legal Admin System</p>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {/* Added the link to the Dashboard page */}
            <li><Link to="/dashboard">📊 Dashboard</Link></li>
            <li><Link to="/cases">📂 Cases</Link></li>
            <li><Link to="/clients">👥 Clients</Link></li>
            <li><Link to="/lawyers">⚖️ Lawyers</Link></li>
            <li><Link to="/appointments">📅 Appointments</Link></li>
            <li><Link to="/invoices">💳 Billing</Link></li>
            <li><Link to="/documents">📄 Documents</Link></li>
          </ul>
        </nav>
        <div className="sidebar-footer" style={{ padding: '20px' }}>
          <button className="btn danger" style={{ width: '100%' }} onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <main className="main-content">
        <header className="top-header">
          <div className="breadcrumb">
            Admin / <strong>{location.pathname.replace("/", "").toUpperCase() || "DASHBOARD"}</strong>
          </div>
          
          <div className="header-actions">
            {isAdmin && <AppointmentNotification />}
            <div className="user-pill">
              {user.role}
            </div>
          </div>
        </header>

        <div className="content-padding">
          <div className="container">
            {/* STATS REMOVED FROM HERE: They now live in Overview.jsx */}
            <Outlet /> 
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;