import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

function Document() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [formData, setFormData] = useState({ case_id: "" });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Modal State for Preview ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error("Error fetching documents", err);
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // --- Fixed handleAction using the Modal logic ---
  const handleAction = async (docId, fileName, fileType, actionType) => {
    try {
      setMessage(actionType === "download" ? "Downloading..." : "Preparing Preview...");
      const endpoint = actionType === "preview" ? `/documents/preview/${docId}` : `/documents/download/${docId}`;
      const response = await api.get(endpoint, { responseType: "blob" });

      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);

      if (actionType === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // OPEN MODAL (Same as Lawyer portal)
        setPreviewUrl(url);
        setPreviewName(fileName);
        setPreviewType(fileType);
      }
      setMessage("");
    } catch (err) {
      console.error("File error:", err);
      alert("Could not process file.");
      setMessage("");
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!formData.case_id || selectedFiles.length === 0) {
      alert("Please enter a Case ID and select files.");
      return;
    }
    const data = new FormData();
    data.append("case_id", formData.case_id);
    for (let i = 0; i < selectedFiles.length; i++) {
      data.append("documents", selectedFiles[i]);
    }
    try {
      setMessage("Uploading...");
      await api.post("/documents", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Upload successful! ✅");
      setSelectedFiles([]);
      setFormData({ case_id: "" });
      fetchDocuments();
    } catch (err) {
      setMessage("Upload failed.");
    }
  };

  const handleAISummarize = async (docId) => {
    setIsAiLoading(true);
    setSummary("");
    setMessage("AI is analyzing and translating to Nepali...");
    try {
      const res = await api.post(`/summarize/${docId}`);
      setSummary(res.data.data);
      setMessage("AI Nepali Gist Generated! ✅");
    } catch (err) {
      setMessage("AI Error: " + (err.response?.data?.message || "Error"));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
      setMessage("Document deleted.");
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const term = searchTerm.toLowerCase();
    return (
      doc.id.toString().includes(term) || 
      doc.case_id.toString().includes(term) ||
      doc.file_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container">
      {/* --- PREVIEW MODAL OVERLAY --- */}
      {previewUrl && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ margin: 0 }}>Preview: {previewName}</h4>
              <button className="btn danger small" onClick={closePreview}>Close Preview</button>
            </div>
            <div className="modal-body">
              <iframe src={previewUrl} width="100%" height="600px" title="Document Preview" />
            </div>
          </div>
        </div>
      )}

      <h2>📄 Document Management (Admin)</h2>
      {message && <p className="message success">{message}</p>}

      {summary && (
        <div className="card ai-summary-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>🤖 AI Nepali Gist</h3>
            <button className="btn small danger" onClick={() => setSummary("")}>Close</button>
          </div>
          <p>{summary}</p>
        </div>
      )}

      <div className="card">
        <h3>Upload New Evidence/Files</h3>
        <form onSubmit={handleFileUpload} className="form-grid">
          <input
            type="text"
            placeholder="Case ID"
            value={formData.case_id}
            onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
            required
          />
          <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} required />
          <button type="submit" className="btn primary">Upload Files</button>
        </form>
      </div>

      <div className="table-header-row">
        <h3>Stored Documents</h3>
        <input 
          type="text" 
          placeholder="Search documents..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>File Name</th>
              <th>Case ID</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => (
              <tr key={doc.id}>
                <td><code>#{doc.id}</code></td>
                <td>{doc.file_name}</td>
                <td><strong>Case {doc.case_id}</strong></td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-buttons" style={{ display: "inline-flex", gap: "5px" }}>
                    <button 
                      className="btn small" 
                      onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'preview')}
                    >
                      👁️ Preview
                    </button>
                    <button 
                      className="btn small" 
                      onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'download')}
                    >
                      ⬇️ Download
                    </button>
                    
                    {doc.file_name.toLowerCase().endsWith('.pdf') && (
                      <button className="btn primary small" onClick={() => handleAISummarize(doc.id)} disabled={isAiLoading}>
                        {isAiLoading ? "..." : "AI Gist"}
                      </button>
                    )}
                    
                    <button className="btn danger small" onClick={() => handleDelete(doc.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Document;