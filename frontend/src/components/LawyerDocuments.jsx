import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";
import "../App.css";

const LawyerDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Modal State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const passedCaseId = location.state?.filterCaseId;

  useEffect(() => {
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
    fetchDocs();
  }, [user.id]);

  const handleAction = async (docId, fileName, fileType, actionType) => {
    try {
      // 1. Reset and signal start
      setMessage(actionType === "download" ? "Downloading..." : "Preparing Preview...");
      console.log(`Starting ${actionType} for Doc ID: ${docId}`);

      const endpoint = actionType === "preview" 
        ? `/documents/preview/${docId}` 
        : `/documents/download/${docId}`;

      // 2. The API Call - IMPORTANT: Explicit responseType
      const response = await api.get(endpoint, { 
        responseType: "blob",
        timeout: 30000 // 30 second timeout
      });

      console.log("Server Response Received:", response);

      // 3. Handle File Metadata
      const mimeTypeMap = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
      };
      const blobType = response.headers['content-type'] || mimeTypeMap[fileType.toLowerCase()] || "application/octet-stream";
      
      // 4. Create Blob and Object URL
      const blob = new Blob([response.data], { type: blobType });
      
      // Check if the "file" is actually a JSON error (common bug)
      if (blob.size < 500 && blobType.includes("json")) {
        const text = await blob.text();
        console.error("Server returned an error instead of a file:", text);
        alert("Server Error: " + text);
        setMessage("");
        return;
      }

      const url = window.URL.createObjectURL(blob);

      if (actionType === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setMessage("");
      } else {
        // 5. Trigger Modal
        setPreviewUrl(url);
        setPreviewName(fileName);
        setPreviewType(blobType);
        setMessage("");
      }
    } catch (err) {
      console.error("Action Error:", err);
      alert("Failed to process file. Check console (F12) for details.");
      setMessage("");
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const filteredDocs = passedCaseId ? documents.filter(d => d.case_id === passedCaseId) : documents;

  if (loading) return <div className="container">Loading documents...</div>;

  return (
    <div className="container">
      {/* --- PREVIEW MODAL --- */}
      {previewUrl && (
        <div className="modal-overlay" onClick={closePreview} style={overlayStyle}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={modalStyle}>
            <div className="modal-header" style={{display:'flex', justifyContent:'space-between', padding:'10px', background:'#f4f4f4'}}>
              <h4 style={{margin:0}}>{previewName}</h4>
              <button onClick={closePreview} className="btn danger small">Close</button>
            </div>
            <div className="modal-body" style={{height:'85vh'}}>
              {previewType === "application/pdf" ? (
                <embed src={previewUrl} type="application/pdf" width="100%" height="100%" />
              ) : (
                <div style={{display:'flex', justifyContent:'center', height:'100%', overflowY:'auto'}}>
                  <img src={previewUrl} alt="Preview" style={{maxWidth:'100%', objectFit:'contain'}} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <h3>📄 Documents</h3>
        {message && <div style={{padding:'10px', color:'blue', fontWeight:'bold'}}>{message}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Case</th>
              <th style={{textAlign:'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map(doc => (
              <tr key={doc.id}>
                <td>{doc.file_name}</td>
                <td>#{doc.case_id}</td>
                <td style={{textAlign:'right'}}>
                  <button className="btn primary small" onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'download')}>Download</button>
                  <button className="btn secondary small" style={{marginLeft:'5px'}} onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'preview')}>Preview</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Internal styles for quick fix
const overlayStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' };
const modalStyle = { background:'white', width:'90%', height:'95%', borderRadius:'8px', overflow:'hidden' };

export default LawyerDocuments;