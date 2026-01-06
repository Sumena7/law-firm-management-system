import { Outlet, NavLink, useLocation } from "react-router-dom";
import "../App.css";

function LawyerDashboard({ handleLogout }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Everest Law Chamber</h2>
          <p>Lawyer Portal</p>
        </div>
        <hr style={{ borderColor: "#34495e", width: '100%', margin: '15px 0' }} />
        
        <nav className="sidebar-nav">
          <ul>
            {/* Added a dedicated Dashboard link */}
            <li><NavLink to="/lawyer/dashboard">📊 Overview</NavLink></li>
            <li><NavLink to="/lawyer/cases">📂 My Cases</NavLink></li>
            <li><NavLink to="/lawyer/appointments">📅 My Schedule</NavLink></li>
            <li><NavLink to="/lawyer/clients">👥 My Clients</NavLink></li>
            <li><NavLink to="/lawyer/documents">📄 Case Files</NavLink></li>
          </ul>
        </nav>

        <div className="logout-container">
          <div style={{ padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>
            Logged in as: <span style={{ color: '#fff' }}>{user.name}</span>
          </div>
          <button className="btn danger" onClick={handleLogout} style={{width: '100%'}}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="container">
          {/* This Outlet now handles showing Overview OR Cases OR Schedule */}
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}

export default LawyerDashboard;