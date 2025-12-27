import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import "../App.css";

const LawyerDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  // Modal State for Preview
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const passedCaseId = location.state?.filterCaseId;

  const fetchDocs = async () => {
    if (!user.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/documents/lawyer/${user.id}`);
      if (res.data.success) setDocuments(res.data.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [user.id]);

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
        // OPEN MODAL INSTEAD OF NEW WINDOW
        setPreviewUrl(url);
        setPreviewName(fileName);
        setPreviewType(fileType);
      }
      setMessage("");
    } catch (err) {
      alert("Could not process file.");
      setMessage("");
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
  };

  const filteredDocs = passedCaseId ? documents.filter(d => d.case_id === passedCaseId) : documents;

  if (loading) return <div className="container">Loading assigned documents...</div>;

  return (
    <div className="container">
      {/* --- PREVIEW MODAL OVERLAY --- */}
      {previewUrl && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{margin: 0}}>Preview: {previewName}</h4>
              <button className="btn danger small" onClick={closePreview}>Close Preview</button>
            </div>
            <div className="modal-body">
              <iframe src={previewUrl} width="100%" height="600px" title="Document Preview" />
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>📄 {passedCaseId ? `Files for Case #${passedCaseId}` : "My Assigned Case Files"}</h3>
        </div>

        {message && <p className="message success">{message}</p>}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Case ID</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id}>
                  <td><strong>{doc.file_name}</strong></td>
                  <td><span className="badge-case">#{doc.case_id}</span></td>
                  <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn primary small" onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'download')}>Download</button>
                    <button className="btn secondary small" style={{marginLeft: '5px'}} onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'preview')}>Preview</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LawyerDocuments;