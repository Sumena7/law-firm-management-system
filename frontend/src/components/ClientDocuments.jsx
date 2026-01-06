import React, { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

const ClientDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for Preview
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchMyDocs();
  }, [user.id]);

  const fetchMyDocs = async () => {
    if (!user.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/documents/client/${user.id}`);
      if (res.data.success) setDocuments(res.data.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (docId, fileName, fileType, actionType) => {
    try {
      const endpoint = actionType === "preview" 
        ? `/documents/preview/${docId}` 
        : `/documents/download/${docId}`;
      
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
      } else {
        setPreviewUrl(url);
        setPreviewName(fileName);
      }
    } catch (err) {
      alert("Could not access file.");
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  if (loading) return <div className="container">Loading your documents...</div>;

  return (
    <div className="container">
      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{margin: 0}}>{previewName}</h4>
              <button className="btn danger small" onClick={closePreview}>Close</button>
            </div>
            <div className="modal-body">
              <iframe src={previewUrl} width="100%" height="500px" title="Doc Preview" />
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>📄 My Shared Documents</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>View or download files related to your legal cases.</p>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Case Ref</th>
                <th>Date Shared</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? (
                documents.map(doc => (
                  <tr key={doc.id}>
                    <td><strong>{doc.file_name}</strong></td>
                    <td><span className="badge-case">#{doc.case_id}</span></td>
                    <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn primary small" onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'download')}>Download</button>
                      <button className="btn secondary small" style={{marginLeft: '5px'}} onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'preview')}>View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">No documents have been shared with you yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientDocuments;