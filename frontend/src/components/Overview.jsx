// Overview.jsx
import DashboardStats from "./DashboardStats";

function Overview() {
  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Admin Overview</h2>
      <DashboardStats />
      {/* You could also add a recent activity list or a calendar here later */}
    </div>
  );
}

export default Overview;