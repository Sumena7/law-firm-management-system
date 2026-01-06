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

  // 1. State to track the active filter (the "Slicer")
  const [timeframe, setTimeframe] = useState("All Time");

  const fetchStats = (period) => {
    // 2. We pass the timeframe as a query parameter to your API
    fetch(`http://localhost:3000/api/dashboard-summary/dashboard-summary?period=${period}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setStats(result.data);
        }
      })
      .catch((err) => console.error("Stats Fetch Error:", err));
  };

  // Re-fetch data whenever the timeframe changes
  useEffect(() => {
    fetchStats(timeframe);
  }, [timeframe]);

  return (
    <div>
      {/* 3. THE SLICER UI BAR */}
      <div className="slicer-bar" style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '5px',
        background: '#f8fafc',
        borderRadius: '10px',
        width: 'fit-content'
      }}>
        {["All Time", "This Month", "Today"].map((option) => (
          <button
            key={option}
            onClick={() => setTimeframe(option)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: '0.3s',
              backgroundColor: timeframe === option ? '#3b82f6' : 'transparent',
              color: timeframe === option ? '#fff' : '#64748b'
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* YOUR EXISTING STATS CARDS */}
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
    </div>
  );
};

export default DashboardStats;