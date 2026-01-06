import React, { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

const LawyerAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments/lawyer/${user.id}`);
      
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

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3>📅 My Schedule & Hearings</h3>
        <button className="btn success small" onClick={fetchAppointments}>Refresh Schedule</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Loading your schedule...</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Case Info</th>
                <th>Client Details</th>
                <th>Status</th>
                <th>Documents</th>
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
                        {new Date(app.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {app.case_title || "General Consultation"}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#2563eb', marginTop: '2px' }}>
                        {app.purpose}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{app.resolved_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>
                        {app.resolved_email ? `📧 ${app.resolved_email}` : "No email provided"}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${app.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      {app.initial_document ? (
                        <a 
                          href={`http://localhost:3000/${app.initial_document}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn primary small"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          📄 View File
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No attachments
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>📭</div>
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