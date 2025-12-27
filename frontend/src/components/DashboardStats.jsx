import React, { useState, useEffect } from "react";

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalClients: 0,
    totalLawyers: 0,
    totalAppointments: 0,
    totalBills: 0,
    totalDocuments: 0
  });

  useEffect(() => {
    // The URL must match your working backend route exactly
    fetch("http://localhost:3000/api/dashboard-summary/dashboard-summary")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setStats(result.data);
        }
      })
      .catch((err) => console.error("Stats Fetch Error:", err));
  }, []);

  return (
    <div className="stats-grid">
      <div className="stat-card" style={{ borderLeftColor: "#2563eb" }}>
        <span className="stat-label">Total Cases</span>
        <div className="stat-number">{stats.totalCases}</div>
      </div>
      <div className="stat-card" style={{ borderLeftColor: "#16a34a" }}>
        <span className="stat-label">Clients</span>
        <div className="stat-number">{stats.totalClients}</div>
      </div>
      <div className="stat-card" style={{ borderLeftColor: "#7c3aed" }}>
        <span className="stat-label">Lawyers</span>
        <div className="stat-number">{stats.totalLawyers}</div>
      </div>
      <div className="stat-card" style={{ borderLeftColor: "#eab308" }}>
        <span className="stat-label">Appointments</span>
        <div className="stat-number">{stats.totalAppointments}</div>
      </div>
      <div className="stat-card" style={{ borderLeftColor: "#ea580c" }}>
        <span className="stat-label">Invoices</span>
        <div className="stat-number">{stats.totalBills}</div>
      </div>
      <div className="stat-card" style={{ borderLeftColor: "#64748b" }}>
        <span className="stat-label">Documents</span>
        <div className="stat-number">{stats.totalDocuments}</div>
      </div>
    </div>
  );
};

export default DashboardStats;