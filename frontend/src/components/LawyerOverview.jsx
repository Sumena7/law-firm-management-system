import React from "react";
import LawyerStats from "./LawyerStats";

const LawyerOverview = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <>
      <header className="dashboard-header" style={{ marginBottom: '20px' }}>
        <h1>Welcome back, Advocate {user.name?.split(' ')[0]}</h1>
        <p>Here is what's happening with your caseload today.</p>
      </header>

      {}
      <LawyerStats />

      <div className="card shadow-sm" style={{ marginTop: '20px', padding: '20px' }}>
        <h3>Upcoming for Today</h3>
        <p style={{ color: '#64748b' }}>Check your "My Schedule" tab for a full list of meetings.</p>
        {}
      </div>
    </>
  );
};

export default LawyerOverview;