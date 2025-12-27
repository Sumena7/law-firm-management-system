import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api"; 
import "../App.css";

const LawyerCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { fetchMyCases(); }, [user.id]);

  const fetchMyCases = async () => {
    if (!user.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/cases/lawyer/${user.id}`);
      if (res.data && res.data.success) setCases(res.data.data);
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
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
      if (res.data.success) alert(`Success: File linked to Case #${caseId}`);
    } catch (err) {
      alert("Upload failed. Ensure the file is a valid PDF or Image.");
    } finally {
      setUploadingId(null);
      // Reset input value so same file can be uploaded again if needed
      e.target.value = null;
    }
  };

  return (
    <div className="card shadow-sm">
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
                <th>Title & Description</th>
                <th>Client Name</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.case_id}>
                  <td><span className="text-bold"># {item.case_id}</span></td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{item.case_title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.description}</div>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LawyerCases;