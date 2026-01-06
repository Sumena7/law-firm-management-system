import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api"; 
import Swal from "sweetalert2";
import "../App.css";

const LawyerCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null); // ✅ For viewing details
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { fetchMyCases(); }, [user.id]);

  const fetchMyCases = async () => {
    if (!user.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/cases/lawyer/${user.id}`);
      if (res.data && res.data.success) setCases(res.data.data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFileUpload = async (e, caseId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("documents", file);
    formData.append("case_id", caseId);

    try {
      setUploadingId(caseId);
      const res = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'File Uploaded',
          text: `Success: File linked to Case #${caseId}`,
          confirmButtonColor: '#10b981',
          timer: 2500
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Ensure the file is a valid PDF or Image and try again.',
        confirmButtonColor: '#dc2626'
      });
      console.error("Upload Error:", err);
    } finally {
      setUploadingId(null);
      e.target.value = null;
    }
  };

  return (
    <div className="card shadow-sm">
      {/* --- CONDITIONAL RENDER: DETAIL VIEW --- */}
      {selectedCase ? (
        <div className="case-detail-view" style={{ animation: "fadeIn 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>🔍 Case Summary: #{selectedCase.case_id}</h3>
            <button className="btn small" onClick={() => setSelectedCase(null)}>Back to Caseload</button>
          </div>
          
          <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div className="detail-item">
              <strong>Title:</strong> <p>{selectedCase.case_title}</p>
            </div>
            <div className="detail-item">
              <strong>Category:</strong> <p><span className="badge-outline">{selectedCase.category || "General"}</span></p>
            </div>
            <div className="detail-item">
              <strong>Client:</strong> <p>{selectedCase.client_name}</p>
            </div>
            <div className="detail-item">
              <strong>Status:</strong> <p><span className={`badge ${selectedCase.status?.toLowerCase()}`}>{selectedCase.status}</span></p>
            </div>
          </div>

          <div style={{ padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <strong>Full Legal Description:</strong>
            <p style={{ whiteSpace: "pre-wrap", marginTop: "10px", lineHeight: "1.6", color: "#334155" }}>
              {selectedCase.description}
            </p>
          </div>

          <div className="form-actions">
             <button 
                className="btn primary small" 
                onClick={() => navigate("/lawyer/documents", { state: { filterCaseId: selectedCase.case_id } })}
              >
                Go to Case Files
              </button>
          </div>
        </div>
      ) : (
        /* --- MAIN TABLE VIEW --- */
        <>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>📂 My Active Caseload</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Manage your assigned cases and upload evidence.</p>
          </div>

          {loading ? (
            <div className="loader">Analyzing database...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Category</th> {/* ✅ Added Column */}
                    <th>Title (Click to view)</th>
                    <th>Client Name</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length > 0 ? (
                    cases.map((item) => (
                      <tr key={item.case_id} className="row-hover">
                        <td><span className="text-bold"># {item.case_id}</span></td>
                        {/* ✅ Category Badge */}
                        <td>
                          <span className="badge-outline" style={{ fontSize: '0.75rem' }}>
                            {item.category || "General"}
                          </span>
                        </td>
                        <td 
                          onClick={() => setSelectedCase(item)} 
                          style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', textDecoration: 'underline' }}
                        >
                          {item.case_title}
                        </td>
                        <td>{item.client_name}</td>
                        <td><span className={`badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <label className="btn success small" style={{ cursor: 'pointer', margin: 0 }}>
                              {uploadingId === item.case_id ? "..." : "Upload"}
                              <input type="file" hidden onChange={(e) => handleFileUpload(e, item.case_id)} />
                            </label>
                            <button 
                              className="btn secondary small" 
                              onClick={() => navigate("/lawyer/documents", { state: { filterCaseId: item.case_id } })}
                            >
                              Files
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="6" style={{textAlign: 'center', padding: '30px'}}>No cases assigned yet.</td>
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

export default LawyerCases;