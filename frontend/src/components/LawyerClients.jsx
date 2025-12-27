import React, { useState, useEffect } from "react";
import api from "../api";

const LawyerClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Inside LawyerClients.jsx
useEffect(() => {
  const fetchClients = async () => {
    try {
      setLoading(true);
      // CHANGE THIS URL: Call the clients API, not the lawyers API
      const res = await api.get(`/clients/lawyer/${user.id}`); 
      if (res.data.success) setClients(res.data.data);
    } catch (err) { 
      console.error("Client Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };
  if (user.id) fetchClients();
}, [user.id]);

  return (
    <div className="card shadow-sm">
      <h3 style={{ marginBottom: '20px' }}>👥 My Active Clients</h3>
      {loading ? (
        <div className="loader">Loading Clients...</div>
      ) : clients.length === 0 ? (
        <p>No clients found.</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Contact Information & Address</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{client.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #{client.id}</div>
                  </td>
                  <td>
                    <div>📧 {client.email}</div>
                    <div>📞 {client.phone}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      📍 {client.address || "Kathmandu, Nepal"}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn primary small">Message</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LawyerClients;