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
    navigate("/auth/login");
    window.location.reload();
  };

  // Helper to highlight the active tab
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
            <li className={getNavClass("/client/cases")}>
              <Link to="/client/cases">⚖️ My Cases</Link>
            </li>
            <li className={getNavClass("/client/lawyers")}>
  <Link to="/client/lawyers">🎓 Lawyer Profiles</Link>
</li>
            <li className={getNavClass("/client/appointments")}>
              <Link to="/client/appointments">📅 My Appointments</Link>
            </li>
            <li className={getNavClass("/client/documents")}>
              <Link to="/client/documents">📄 My Documents</Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
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
        <header className="dashboard-header" style={{ marginBottom: '20px' }}>
            <h1>Hello, {user.name?.split(' ')[0]}</h1>
            <p>Access your case status, documents, and upcoming schedule.</p>
        </header>

        {/* This is where ClientCases, ClientAppointments, and ClientDocuments will render */}
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default ClientDashboard;