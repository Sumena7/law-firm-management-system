import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

function Case() {
  const [cases, setCases] = useState([]);
  const [similarCases, setSimilarCases] = useState([]);
  const [formData, setFormData] = useState({
    title: "", status: "open", client_id: "", assigned_lawyer_id: "", description: ""
  });
  const [searchId, setSearchId] = useState("");
  const [message, setMessage] = useState("");
  const [editingCase, setEditingCase] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch all cases on component load
  const fetchAllCases = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/cases");
      setCases(res.data.data || res.data || []);
      setSimilarCases([]);
      setMessage("");
    } catch (err) {
      console.error("Error fetching cases", err);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCases();
  }, []);

  // 2. Download all files for a case as a ZIP
  const handleDownloadAll = async (caseId, caseTitle) => {
    try {
      setMessage("Preparing your zip file... ⏳");
      const response = await api.get(`/documents/download/case/${caseId}`, {
        responseType: 'blob', // Required for binary/zip data
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Format filename
      const fileName = `${caseTitle.replace(/\s+/g, '_')}_Documents.zip`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage("Download started! ✅");
    } catch (err) {
      console.error("Download error:", err);
      setMessage("Error: No documents found for this case.");
    }
  };

  // 3. Search for a specific case and get AI similarities
  const handleSearch = async () => {
    if (!searchId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/cases/${searchId}`);
      const { currentCase, similarCases } = res.data.data;
      setCases([currentCase]);
      setSimilarCases(similarCases || []);
      setMessage(`Showing details for Case #${searchId} and its AI matches.`);
    } catch (err) {
      setMessage("Case not found.");
      setCases([]);
      setSimilarCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Create or Update a case
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        await api.put(`/cases/${editingCase.id}`, formData);
        setMessage("Case updated! ✅");
      } else {
        await api.post("/cases", formData);
        setMessage("New case registered! ✅");
      }
      setEditingCase(null);
      setFormData({ title: "", status: "open", client_id: "", assigned_lawyer_id: "", description: "" });
      fetchAllCases();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving case");
    }
  };

  // 5. Prepare form for editing
  const handleEdit = (c) => {
    setEditingCase(c);
    setFormData({
      title: c.title,
      status: c.status,
      client_id: c.client_id,
      assigned_lawyer_id: c.assigned_lawyer_id,
      description: c.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 6. Delete a case record
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this case record?")) return;
    try {
      await api.delete(`/cases/${id}`);
      fetchAllCases();
      setMessage("Case deleted successfully.");
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="container">
      <h2>📂 Legal Case Management</h2>
      {message && (
        <p className={`message ${message.includes('Error') || message.includes('not found') ? 'danger' : 'success'}`}>
          {message}
        </p>
      )}

      {/* Header Search & Actions */}
      <div className="table-header-row card" style={{ padding: "15px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", flex: 1 }}>
          <input
            className="search-input"
            placeholder="Search by Case ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button className="btn primary" onClick={handleSearch}>Search Case</button>
          <button className="btn" onClick={fetchAllCases}>Show All</button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="card">
        <h3>{editingCase ? "📝 Edit Case Details" : "🆕 Register New Case"}</h3>
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: "15px" }}>
          <input 
            placeholder="Case Title" 
            value={formData.title} 
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            required 
          />
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
          <input 
            placeholder="Client ID" 
            value={formData.client_id} 
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} 
            required 
          />
          <input 
            placeholder="Assigned Lawyer ID" 
            value={formData.assigned_lawyer_id} 
            onChange={(e) => setFormData({ ...formData, assigned_lawyer_id: e.target.value })} 
          />
          <textarea 
            placeholder="Legal Description & Facts" 
            style={{ gridColumn: "span 2", minHeight: "100px" }}
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            required 
          />
          <div className="form-actions">
            <button type="submit" className="btn primary">{editingCase ? "Update" : "Register Case"}</button>
            {editingCase && (
              <button 
                type="button" 
                className="btn" 
                onClick={() => { 
                  setEditingCase(null); 
                  setFormData({ title: "", status: "open", client_id: "", assigned_lawyer_id: "", description: "" }); 
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Active Cases Table */}
      <h3 style={{ marginTop: "40px" }}>Case Records</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Case Info</th>
              <th>Status</th>
              <th>Associations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
                <tr><td colSpan="5" className="empty">Loading cases...</td></tr>
            ) : cases.length > 0 ? (
              cases.map((c) => (
                <tr key={c.id}>
                  <td><code>#{c.id}</code></td>
                  <td style={{ maxWidth: "300px" }}>
                    <strong>{c.title}</strong><br/>
                    <small style={{ color: "#666" }}>{c.description?.substring(0, 50)}...</small>
                  </td>
                  <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                  <td>
                    <small>Client: #{c.client_id}</small><br/>
                    <small>Lawyer: #{c.assigned_lawyer_id}</small>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      <button className="btn small" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn danger small" onClick={() => handleDelete(c.id)}>Delete</button>
                      
                      {/* NEW: ZIP Download Action */}
                      <button 
                        className="btn small" 
                        onClick={() => handleDownloadAll(c.id, c.title)}
                        style={{ backgroundColor: "#0ea5e9", color: "white", border: "none" }}
                        title="Download all documents for this case"
                      >
                        📦 Zip
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="empty">No cases found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI Insights Section */}
      {similarCases.length > 0 && (
        <div className="card" style={{ marginTop: "40px", border: "2px solid var(--primary)", background: "#f8f9ff" }}>
          <h3 style={{ color: "var(--primary)" }}>🤖 AI Legal Intelligence: Similar Precedents</h3>
          <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "15px" }}>
            The AI has analyzed the case description and found these historical matches:
          </p>
          <div className="table-container">
            <table className="table">
              <thead style={{ background: "#eef2ff" }}>
                <tr>
                  <th>Match</th>
                  <th>Title</th>
                  <th>Legal Description</th>
                  <th>Match Score</th>
                </tr>
              </thead>
              <tbody>
                {similarCases.map((c) => (
                  <tr key={c.id}>
                    <td><code>#{c.id}</code></td>
                    <td><strong>{c.title}</strong></td>
                    <td style={{ fontSize: "0.85rem" }}>{c.description}</td>
                    <td>
                      <div className="similarity-meter">
                        <div className="similarity-fill" style={{ width: `${c.similarity * 100}%` }}></div>
                        <span>{(c.similarity * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Case;