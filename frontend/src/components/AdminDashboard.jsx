import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import AppointmentNotification from "./AppointmentNotification"; 
import "../App.css";

function AdminDashboard({ handleLogout }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  
  const isAdmin = user.role === 'admin' || user.role === 'staff';

 
  const getBreadcrumbTitle = () => {
    const path = location.pathname.split("/").pop(); 
    return path === "admin" || path === "dashboard" ? "DASHBOARD" : path.toUpperCase();
  };

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Everest Law Chamber</h2>
          <p>ADMIN CONTROL</p>
        </div>
        <hr style={{ borderColor: "#34495e", width: '100%', margin: '15px 0' }} />

        <nav className="sidebar-nav">
          <ul>
            {}
            <li><NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "active" : ""}>📊 Dashboard</NavLink></li>
            <li><NavLink to="/admin/lawyers" className={({isActive}) => isActive ? "active" : ""}>⚖️ Lawyers</NavLink></li>
            <li><NavLink to="/admin/clients" className={({isActive}) => isActive ? "active" : ""}>👥 Clients</NavLink></li>
            <li><NavLink to="/admin/cases" className={({isActive}) => isActive ? "active" : ""}>📂 Cases</NavLink></li>
            <li><NavLink to="/admin/appointments" className={({isActive}) => isActive ? "active" : ""}>📅 Appointments</NavLink></li>
            <li><NavLink to="/admin/invoices" className={({isActive}) => isActive ? "active" : ""}>💳 Billing</NavLink></li>
            <li><NavLink to="/admin/documents" className={({isActive}) => isActive ? "active" : ""}>📄 Documents</NavLink></li>
            
            {isAdmin && (
              <li><NavLink to="/admin/admin/users" className={({isActive}) => isActive ? "active" : ""}>🛡️ Manage Users</NavLink></li>
            )}
          </ul>
        </nav>

        <div className="logout-container">
          <button onClick={handleLogout} className="btn danger" style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <div className="breadcrumb">
              Admin / <strong>{getBreadcrumbTitle()}</strong>
            </div>
          </div>
          
          <div className="header-actions">
            {/* --- THE NOTIFICATION BELL --- */}
            {isAdmin && (
              <div className="notification-wrapper-outer">
                <AppointmentNotification />
              </div>
            )}
            
            <div className="user-pill">
               <span className="user-role-badge">{user.role?.toUpperCase()}</span>
               <span className="user-name">{user.name || "Admin User"}</span>
            </div>
          </div>
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

export default AdminDashboard;