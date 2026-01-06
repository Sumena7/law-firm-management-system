import React, { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

const LawyerDirectory = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get("/lawyers/public/list");
        setLawyers(res.data.data || []);
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <div className="card shadow-sm" style={{ padding: '20px' }}>
      <div style={{ marginBottom: "25px", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
        <h3 style={{ color: "#0f172a", margin: 0 }}>⚖️ Legal Counsel Directory</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Browse our team of professionals. Use the <strong>Lawyer ID</strong> when filling out your appointment request.
        </p>
      </div>

      {loading ? (
        <div className="loader">Loading legal profiles...</div>
      ) : (
        <div className="lawyer-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '25px' 
        }}>
          {lawyers.map((l) => (
            <div key={l.id} className="profile-card" style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '24px',
              backgroundColor: '#fff',
              position: 'relative'
            }}>
              {/* ID Badge in the corner */}
              <div style={{ 
                position: 'absolute', top: '15px', right: '15px',
                background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px',
                fontSize: '0.75rem', fontWeight: 'bold', color: '#475569',
                border: '1px solid #cbd5e1'
              }}>
                ID: #{l.id}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "18px" }}>
                <div style={{ 
                  width: '55px', height: '55px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #1e293b, #334155)', 
                  color: 'white', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                  {l.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Adv. {l.name}</h4>
                  <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: 'none' }}>
                    {l.specialization}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                <div style={{ marginBottom: '12px', display: 'flex', gap: '15px' }}>
                  <span><strong>Experience:</strong> {l.experience} Years</span>
                  <span><strong>Location:</strong> {l.address || "Main Branch"}</span>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '15px', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                  lineHeight: '1.6'
                }}>
                  <strong>About the Lawyer:</strong>
                  <p style={{ marginTop: '8px', color: '#475569' }}>
                    {l.bio || "This professional is a specialist in their field, dedicated to providing strategic legal counsel and robust representation for all clients."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {lawyers.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No lawyer profiles are currently available.
        </div>
      )}
    </div>
  );
};

export default LawyerDirectory;