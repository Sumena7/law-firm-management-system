import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";
import Swal from "sweetalert2";

function Document() {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [summary, setSummary] = useState("");
  const [formData, setFormData] = useState({ case_id: "" });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Preview Modal State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.data || []);
    } catch (err) {
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Cleanup function to revoke Blob URLs when component unmounts
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAction = async (docId, fileName, fileType, actionType) => {
    try {
      if (actionType === "preview") {
        Swal.fire({ 
          title: 'Generating Preview...', 
          allowOutsideClick: false, 
          didOpen: () => Swal.showLoading() 
        });
      }

      const endpoint = actionType === "preview" ? `/documents/preview/${docId}` : `/documents/download/${docId}`;
      
      // We fetch as blob to ensure the Auth header is included in the request
      const response = await api.get(endpoint, { responseType: "blob" });
      
      // Create a blob with the explicit MIME type from the database
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
        // Set preview state
        setPreviewUrl(url);
        setPreviewName(fileName);
        setPreviewType(fileType);
        Swal.close();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not process file. Ensure the server is running.", "error");
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
    setPreviewType("");
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!formData.case_id || selectedFiles.length === 0) {
      Swal.fire("Wait!", "Please enter a Case ID and select files.", "warning");
      return;
    }

    const data = new FormData();
    data.append("case_id", formData.case_id);
    for (let i = 0; i < selectedFiles.length; i++) {
      data.append("documents", selectedFiles[i]);
    }

    try {
      Swal.fire({ title: 'Uploading...', text: 'Please wait.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await api.post("/documents", data, { headers: { "Content-Type": "multipart/form-data" } });
      Swal.fire("Success", "Documents uploaded successfully!", "success");
      setSelectedFiles([]);
      setFormData({ case_id: "" });
      fetchDocuments();
    } catch (err) {
      Swal.fire("Upload Failed", "Could not upload documents.", "error");
    }
  };

  const handleAISummarize = async (docId) => {
    setIsAiLoading(true);
    setSummary("");
    Swal.fire({
      title: '🤖 AI Analyzing',
      html: 'Processing legal text...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await api.post(`/summarize/${docId}`);
      setSummary(res.data.data);
      Swal.close();
    } catch (err) {
      // ✅ FIX: Show the actual error message from the backend
      const errMsg = err.response?.data?.message || "Failed to generate summary.";
      Swal.fire("AI Error", errMsg, "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Document?',
      text: "This file will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/documents/${id}`);
        fetchDocuments();
        Swal.fire("Deleted", "Document removed.", "success");
      } catch (err) {
        Swal.fire("Error", "Delete failed.", "error");
      }
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
      {/* PDF / IMAGE PREVIEW MODAL */}
      {previewUrl && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ margin: 0 }}>Viewing: {previewName}</h4>
              <button className="btn danger small" onClick={closePreview}>Close</button>
            </div>
            <div className="modal-body" style={{ height: "80vh", padding: "0" }}>
              {/* Use Object tag for better PDF rendering via Blob URLs */}
              <object
                data={previewUrl}
                type={previewType}
                width="100%"
                height="100%"
                style={{ borderRadius: "0 0 8px 8px" }}
              >
                <div style={{ padding: "20px", textAlign: "center" }}>
                   <p>Browser cannot display this file type inline.</p>
                   <a href={previewUrl} download={previewName} className="btn primary">Download to View</a>
                </div>
              </object>
            </div>
          </div>
        </div>
      )}

      <h2>📄 Document Management</h2>

     {summary && (
  <div className="card ai-summary-box shadow" style={{ borderLeft: '5px solid #3b82f6', background: '#f0f7ff', marginBottom: '20px', padding: '20px' }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
      <h3 style={{ color: '#1e40af', margin: 0 }}>🤖 AI Nepali Gist</h3>
      <button className="btn small danger" onClick={() => setSummary("")}>Close Gist</button>
    </div>

    {/* ✅ THIS IS THE FIX: whiteSpace: 'pre-wrap' ensures each point stays on its own line */}
    <p style={{ 
      lineHeight: '1.8', 
      fontSize: '1.1rem', 
      color: '#333', 
      whiteSpace: 'pre-wrap', 
      textAlign: 'left' 
    }}>
      {summary}
    </p>
  </div>
)}

      <div className="card">
        <h3>Upload New Evidence</h3>
        <form onSubmit={handleFileUpload} className="form-grid">
          <input
            type="text"
            placeholder="Case ID"
            value={formData.case_id}
            onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
            required
          />
          <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} required />
          <button type="submit" className="btn primary">Upload to Case</button>
        </form>
      </div>

      <div className="table-header-row" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Document Vault</h3>
        <input 
          type="text" 
          placeholder="Search documents..." 
          className="search-input"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '300px' }}
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
              <th>Case</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td><code>#{doc.id}</code></td>
                  <td>{doc.file_name}</td>
                  <td><span className="badge info">Case #{doc.case_id}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons" style={{ display: "inline-flex", gap: "8px" }}>
                      <button className="btn small" onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'preview')} title="Preview">👁️</button>
                      <button className="btn small" onClick={() => handleAction(doc.id, doc.file_name, doc.file_type, 'download')} title="Download">⬇️</button>
                      {doc.file_name.toLowerCase().endsWith('.pdf') && (
                        <button className="btn primary small" onClick={() => handleAISummarize(doc.id)} disabled={isAiLoading}>
                          {isAiLoading ? "..." : "AI Gist"}
                        </button>
                      )}
                      <button className="btn danger small" onClick={() => handleDelete(doc.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No documents found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Document;