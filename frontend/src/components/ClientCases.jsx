import React, { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

const ClientCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchMyCases();
  }, [user.id]);

  const fetchMyCases = async () => {
    if (!user.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/cases/client/${user.id}`);
      if (res.data && res.data.success) {
        setCases(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching your cases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = (item) => {
    setSelectedCase(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="card shadow-sm">
      {selectedCase ? (
        <div className="case-detail-view" style={{ animation: "fadeIn 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3>🔍 Case Details: #{selectedCase.case_id}</h3>
            <button className="btn small" onClick={() => setSelectedCase(null)}>Back to My Cases</button>
          </div>
          <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div className="detail-item">
              <strong>Title:</strong> <p>{selectedCase.case_title}</p>
            </div>
            <div className="detail-item">
              <strong>Category:</strong> <p><span className="badge-outline">{selectedCase.category || "General"}</span></p>
            </div>
            <div className="detail-item">
              <strong>Current Status:</strong> <p><span className={`badge ${selectedCase.status?.toLowerCase()}`}>{selectedCase.status}</span></p>
            </div>
            <div className="detail-item">
              <strong>Legal Counsel:</strong> <p>{selectedCase.lawyer_name || "Being Assigned"}</p>
            </div>
          </div>
          <div style={{ padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <strong>Case Description & Facts:</strong>
            <p style={{ whiteSpace: "pre-wrap", marginTop: "10px", lineHeight: "1.6", color: "#334155" }}>
              {selectedCase.description}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>⚖️ My Legal Matters</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Track the progress of your active cases and view assigned counsel.
            </p>
          </div>

          {loading ? (
            <div className="loader">Updating case status...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Category</th>
                    <th>Case Title (Click to view)</th>
                    <th>Assigned Lawyer</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length > 0 ? (
                    cases.map((item) => (
                      <tr key={item.case_id}>
                        <td><span className="text-bold">#{item.case_id}</span></td>
                        <td>
                          <span className="badge-outline" style={{ fontSize: '0.75rem' }}>
                            {item.category || "General"}
                          </span>
                        </td>
                        <td 
                          onClick={() => handleViewCase(item)} 
                          style={{ cursor: 'pointer', color: '#2563eb', fontWeight: '600', textDecoration: 'underline' }}
                        >
                          {item.case_title}
                        </td>
                        <td>{item.lawyer_name || "Assigning Counsel..."}</td>
                        <td>
                          <span className={`badge ${item.status?.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No active cases found in your profile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientCases;