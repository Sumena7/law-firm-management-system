import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import LawyerStats from "./LawyerStats"; // CHANGED: Using Lawyer-specific stats
import "../App.css";

function LawyerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
    window.location.reload();
  };

  // Improved helper to check for active paths
  const getNavClass = (path) => (location.pathname === path ? "active-link" : "");

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>JusticePanel</h2>
          <p>Lawyer Portal</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li className={getNavClass("/lawyer/cases")}>
              <Link to="/lawyer/cases">📂 My Cases</Link>
            </li>
            <li className={getNavClass("/lawyer/appointments")}>
              <Link to="/lawyer/appointments">📅 My Schedule</Link>
            </li>
            <li className={getNavClass("/lawyer/clients")}>
              <Link to="/lawyer/clients">👥 My Clients</Link>
            </li>
            <li className={getNavClass("/lawyer/documents")}>
              <Link to="/lawyer/documents">📄 Case Files</Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div style={{ padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>
            Logged in as: <span style={{ color: '#fff', textTransform: 'capitalize' }}>{user.name || "Lawyer"}</span>
          </div>
          <button className="btn danger" onClick={handleLogout} style={{width: '100%'}}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* Header Section */}
        <header className="dashboard-header" style={{ marginBottom: '20px' }}>
            <h1>Welcome back, Counselor {user.name?.split(' ')[0]}</h1>
            <p>Here is what's happening with your caseload today.</p>
        </header>

        {/* This component will now call the /lawyer/:id/stats backend route */}
        <LawyerStats /> 

        <div className="container" style={{ marginTop: '30px' }}>
          {/* This renders the specific page: Cases, Clients, etc. */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}

export default LawyerDashboard;