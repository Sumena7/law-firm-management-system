import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";
import Swal from "sweetalert2";

function Case() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null); // For viewing details
  const [similarCases, setSimilarCases] = useState([]);
  const [formData, setFormData] = useState({
    title: "", 
    status: "open", 
    category: "Civil", 
    client_id: "", 
    assigned_lawyer_id: "", 
    description: ""
  });
  const [searchId, setSearchId] = useState("");
  const [editingCase, setEditingCase] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- FETCH ALL CASES ---
  const fetchAllCases = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cases");
      setCases(res.data.data || []);
      setSelectedCase(null); 
      setSimilarCases([]);
    } catch (err) {
      console.error("Fetch error:", err);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCases();
  }, []);

  // --- VIEW CASE DETAILS & AI ANALYSIS ---
  const handleViewDetails = async (caseId) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/cases/${caseId}`);
      // Assuming backend returns { success: true, data: { currentCase, similarCases } }
      const { currentCase, similarCases } = res.data.data;
      setSelectedCase(currentCase);
      setSimilarCases(similarCases || []);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      Swal.fire("Error", "Could not load case details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DOWNLOAD ZIP ---
  const handleDownloadAll = async (caseId, caseTitle) => {
    try {
      Swal.fire({
        title: 'Preparing Zip...',
        text: 'Gathering documents, please wait.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const response = await api.get(`/documents/download/case/${caseId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${caseTitle.replace(/\s+/g, '_')}_Documents.zip`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.close();
    } catch (err) {
      Swal.fire("Not Found", "No documents found for this case.", "info");
    }
  };

  // --- CREATE OR UPDATE CASE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        await api.put(`/cases/${editingCase.id}`, formData);
        Swal.fire("Updated", "Case updated successfully!", "success");
      } else {
        await api.post("/cases", formData);
        Swal.fire("Registered", "New case registered successfully!", "success");
      }
      setEditingCase(null);
      setFormData({ title: "", status: "open", category: "Civil", client_id: "", assigned_lawyer_id: "", description: "" });
      fetchAllCases();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Error saving case", "error");
    }
  };

  const handleEdit = (c) => {
    setEditingCase(c);
    setFormData({
      title: c.title,
      status: c.status,
      category: c.category || "Civil",
      client_id: c.client_id,
      assigned_lawyer_id: c.assigned_lawyer_id,
      description: c.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- DELETE CASE ---
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Case Record?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/cases/${id}`);
        fetchAllCases();
        Swal.fire("Deleted", "Case deleted successfully.", "success");
      } catch (err) {
        Swal.fire("Error", "Delete failed.", "error");
      }
    }
  };

  return (
    <div className="container">
      <h2>📂 Everest Law Chamber: Case Management</h2>

      {/* SEARCH BAR */}
      <div className="table-header-row card" style={{ padding: "15px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1 }}>
          <input
            className="search-input"
            placeholder="Search by Case ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button className="btn primary" onClick={() => handleViewDetails(searchId)}>Search & View</button>
          <button className="btn" onClick={fetchAllCases}>Refresh All</button>
        </div>
      </div>

      {/* CONDITIONAL VIEW: DETAIL VIEW OR REGISTRATION FORM */}
      {selectedCase ? (
        <div className="card shadow mb-4" style={{ borderTop: "5px solid #2563eb", animation: "fadeIn 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ color: "#1e40af" }}>🔍 Case Details: #{selectedCase.id}</h3>
            <button className="btn danger" onClick={() => setSelectedCase(null)}>Close Details</button>
          </div>
          <hr />
          <div className="form-grid">
            <p><strong>Title:</strong> {selectedCase.title}</p>
            <p><strong>Category:</strong> <span className="badge-outline">{selectedCase.category}</span></p>
            <p><strong>Status:</strong> <span className={`badge ${selectedCase.status}`}>{selectedCase.status}</span></p>
            <p><strong>Client ID:</strong> #{selectedCase.client_id}</p>
          </div>
          <div style={{ marginTop: "15px", padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <strong>Legal Summary / Description:</strong>
            <p style={{ whiteSpace: "pre-wrap", marginTop: "10px", lineHeight: "1.6" }}>{selectedCase.description}</p>
          </div>

          {/* AI MATCHES INSIDE DETAIL VIEW */}
          {similarCases.length > 0 && (
            <div style={{ marginTop: "30px" }}>
              <h4 style={{ color: "#3b82f6" }}>🤖 AI Legal Intelligence: Similar Precedents</h4>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>ID</th><th>Precedent Title</th><th>Match</th></tr>
                  </thead>
                  <tbody>
                    {similarCases.map(sc => (
                      <tr key={sc.id}>
                        <td>#{sc.id}</td>
                        <td>{sc.title}</td>
                        <td><div className="similarity-fill" style={{ width: `${sc.similarity * 100}%`, height: "10px", background: "#3b82f6", borderRadius: "5px" }}></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h3>{editingCase ? "📝 Edit Case Details" : "🆕 Register New Case"}</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: "15px" }}>
            <input 
              placeholder="Case Title" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
              required 
            />
            
            <select 
              value={formData.category} 
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="Civil">Civil (देवानी)</option>
              <option value="Criminal">Criminal (फौजदारी)</option>
              <option value="Family">Family (पारिवारिक)</option>
              <option value="Corporate/Trade">Corporate/Trade (व्यापारिक)</option>
              <option value="Property/Land">Property/Land (जग्गा जमिन)</option>
            </select>

            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <option value="open">Open / Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>

            <input 
              placeholder="Client ID" 
              value={formData.client_id} 
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} 
              required 
            />
            
            <textarea 
              placeholder="Enter facts, evidence summary, and legal points..." 
              style={{ gridColumn: "span 2", minHeight: "120px" }}
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              required 
            />

            <div className="form-actions">
              <button type="submit" className="btn primary">{editingCase ? "Update Changes" : "Save Case Record"}</button>
              {editingCase && (
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => { 
                    setEditingCase(null); 
                    setFormData({ title: "", status: "open", category: "Civil", client_id: "", assigned_lawyer_id: "", description: "" }); 
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* MAIN CASE TABLE */}
      <h3 style={{ marginTop: "40px" }}>Case Records</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Case Info (Click to View)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !selectedCase ? (
                <tr><td colSpan="5" className="empty">Processing...</td></tr>
            ) : cases.length > 0 ? (
              cases.map((c) => (
                <tr key={c.id} className="row-hover">
                  <td><code>#{c.id}</code></td>
                  <td><span className="badge-outline">{c.category || "General"}</span></td>
                  <td 
                    onClick={() => handleViewDetails(c.id)} 
                    style={{ cursor: "pointer", color: "#2563eb", fontWeight: "600" }}
                    title="Click to view details"
                  >
                    {c.title}
                  </td>
                  <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button className="btn small" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn danger small" onClick={() => handleDelete(c.id)}>Delete</button>
                      <button className="btn small" onClick={() => handleDownloadAll(c.id, c.title)} style={{ background: "#0ea5e9" }}>Zip</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="empty">No cases found in the chamber records.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Case;