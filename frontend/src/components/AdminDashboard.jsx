import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import DashboardStats from "./DashboardStats"; // Import the new component
import "./App.css";

function AdminDashboard({ handleLogout }) {
  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR - Uses class from App.css */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>JusticePanel</h2>
          <p>ADMIN CONTROL</p>
        </div>
        <hr style={{ borderColor: "#34495e", width: '100%' }} />

        <nav className="sidebar-nav">
          <ul>
            <li><NavLink to="/lawyers">⚖️ Lawyers</NavLink></li>
            <li><NavLink to="/clients">👥 Clients</NavLink></li>
            <li><NavLink to="/cases">📂 Cases</NavLink></li>
            <li><NavLink to="/appointments">📅 Appointments</NavLink></li>
            <li><NavLink to="/invoices">💳 Billing</NavLink></li>
            <li><NavLink to="/documents">📄 Documents</NavLink></li>
          </ul>
        </nav>

        <div className="logout-container">
          <button onClick={handleLogout} className="btn danger" style={{width: '100%'}}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT - Uses class from App.css for margin-left and padding */}
      <div className="main-content">
        {/* Render the Stats Cards here */}
        <DashboardStats />

        <div className="container">
           <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;