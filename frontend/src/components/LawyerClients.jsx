import React, { useState, useEffect } from "react";
import api from "../api";

const LawyerClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        // Ensure this endpoint matches your backend route exactly
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

  // Function to handle the email trigger
  const handleEmailClient = (clientName, clientEmail) => {
    const subject = encodeURIComponent(`Legal Consultation: Everest Law Chamber`);
    const body = encodeURIComponent(`Dear ${clientName},\n\nI am contacting you regarding your ongoing case...`);
    
    // This opens the lawyer's default email app
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="card shadow-sm">
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>👥 My Active Clients</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Direct contact list for assigned caseloads.</p>
      </div>

      {loading ? (
        <div className="loader">Loading Clients...</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No clients currently assigned to your profile.
        </div>
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
                <tr key={client.id} className="row-hover">
                  <td>
                    <div style={{ fontWeight: 'bold', color: 'var(--navy)' }}>{client.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Client ID: #{client.id}</div>
                  </td>
                  <td>
                    <div style={{ marginBottom: '2px' }}>
                      <span title="Click to email" style={{ cursor: 'pointer', color: '#2563eb' }}>
                        📧 {client.email}
                      </span>
                    </div>
                    <div>📞 {client.phone}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      📍 {client.address || "Address not provided"}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn primary small" 
                      onClick={() => handleEmailClient(client.name, client.email)}
                      title={`Send email to ${client.name}`}
                    >
                      Message
                    </button>
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