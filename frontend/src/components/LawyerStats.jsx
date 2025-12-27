import React, { useState, useEffect } from "react";
import api from "../api";

const LawyerStats = () => {
  const [stats, setStats] = useState({
    total_cases: 0,
    upcoming_appointments: 0,
    total_clients: 0,
    total_documents: 0
  });
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This must match the backend route we discussed
        const res = await api.get(`/lawyers/${user.id}/stats`);
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Error loading lawyer stats", err);
      }
    };
    if (user.id) fetchStats();
  }, [user.id]);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-label">📁 My Cases</span>
        <div className="stat-number">{stats.total_cases}</div>
      </div>
      
      <div className="stat-card">
        <span className="stat-label">📅 Upcoming</span>
        <div className="stat-number">{stats.upcoming_appointments}</div>
      </div>
      
      <div className="stat-card">
        <span className="stat-label">👥 My Clients</span>
        <div className="stat-number">{stats.total_clients}</div>
      </div>
      
      <div className="stat-card">
        <span className="stat-label">📄 Case Files</span>
        <div className="stat-number">{stats.total_documents}</div>
      </div>
    </div>
  );
};

export default LawyerStats;