import React, { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

const LawyerAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Calls: /api/appointments/lawyer/22
      const res = await api.get(`/appointments/lawyer/${user.id}`);
      
      // FIX: Access res.data.data to get the array
      if (res.data && res.data.success) {
        setAppointments(res.data.data);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Error fetching lawyer appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3>📅 My Schedule & Hearings</h3>
        <button className="btn success small" onClick={fetchAppointments}>Refresh Schedule</button>
      </div>

      {loading ? (
        <p>Loading your schedule...</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Case Title</th>
                <th>Client</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(appointments) && appointments.length > 0 ? (
                appointments.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>
                        {new Date(app.appointment_date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {/* If you have a separate time column, use it here */}
                        {new Date(app.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td>{app.case_title || "General Consultation"}</td>
                    <td>{app.client_name || app.guest_email || "N/A"}</td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '500' }}>
                        {app.purpose}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${app.status?.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No upcoming appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LawyerAppointments;