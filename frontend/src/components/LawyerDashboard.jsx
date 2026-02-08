import { Outlet, NavLink, useLocation } from "react-router-dom";
import "../App.css";

function LawyerDashboard({ handleLogout }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  
  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    return path === "lawyer-panel" || path === "dashboard" ? "OVERVIEW" : path.toUpperCase();
  };

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
            {}
            <li><NavLink to="/lawyer-panel/dashboard" className={({isActive}) => isActive ? "active" : ""}>📊 Overview</NavLink></li>
            <li><NavLink to="/lawyer-panel/cases" className={({isActive}) => isActive ? "active" : ""}>📂 My Cases</NavLink></li>
            <li><NavLink to="/lawyer-panel/appointments" className={({isActive}) => isActive ? "active" : ""}>📅 My Schedule</NavLink></li>
            <li><NavLink to="/lawyer-panel/clients" className={({isActive}) => isActive ? "active" : ""}>👥 My Clients</NavLink></li>
            <li><NavLink to="/lawyer-panel/documents" className={({isActive}) => isActive ? "active" : ""}>📄 Case Files</NavLink></li>
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
        {}
        <header className="top-header" style={{ marginBottom: '20px', padding: '0 40px', display: 'flex', alignItems: 'center' }}>
            <h3>Lawyer / <span style={{ color: 'var(--primary)' }}>{getPageTitle()}</span></h3>
        </header>

        <div className="content-padding">
          <div className="container">
            {}
            <Outlet /> 
          </div>
        </div>
      </main>
    </div>
  );
}

export default LawyerDashboard;