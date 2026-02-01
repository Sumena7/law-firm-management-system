import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import "../App.css";

function ClientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get the logged-in client's info
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Redirect to landing page on logout
    navigate("/");
    window.location.reload();
  };

  // Helper to highlight the active tab - updated to match new paths
  const getNavClass = (path) => (location.pathname === path ? "active-link" : "");

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Everest Law Chamber</h2>
          <p>Client Portal</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {/* Updated paths to include /client-panel/ to match App.jsx */}
            <li className={getNavClass("/client-panel/cases")}>
              <Link to="/client-panel/cases">⚖️ My Cases</Link>
            </li>
            <li className={getNavClass("/client-panel/lawyers")}>
              <Link to="/client-panel/lawyers">🎓 Lawyer Profiles</Link>
            </li>
            <li className={getNavClass("/client-panel/appointments")}>
              <Link to="/client-panel/appointments">📅 My Appointments</Link>
            </li>
            <li className={getNavClass("/client-panel/documents")}>
              <Link to="/client-panel/documents">📄 My Documents</Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px' }}>
          <div style={{ padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>
            Account: <span style={{ color: '#fff' }}>{user.name || "Client"}</span>
          </div>
          <button className="btn danger" onClick={handleLogout} style={{width: '100%'}}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header" style={{ marginBottom: '20px', height: 'auto', padding: '20px 40px' }}>
            <h1 style={{ margin: 0 }}>Hello, {user.name?.split(' ')[0]}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Access your case status, documents, and upcoming schedule.</p>
        </header>

        {/* This is where ClientCases, ClientAppointments, and ClientDocuments will render */}
        <div className="content-padding">
          <div className="container">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientDashboard;