import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

function Lawyer() {
  const [lawyers, setLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", specialization: "", experience: "", address: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  // Inline style for forcing text visibility
  const highVisibilityStyle = {
    backgroundColor: 'white',
    color: 'black',
    border: '2px solid #94a3b8',
    fontWeight: '600',
    WebkitTextFillColor: 'black',
    opacity: 1
  };

  const fetchLawyers = async () => {
    try {
      const res = await api.get("/lawyers");
      setLawyers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching lawyers:", err);
      setLawyers([]);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  const filteredLawyers = lawyers.filter((lawyer) => {
    const term = searchTerm.toLowerCase();
    return (
      lawyer.id.toString().includes(term) || 
      lawyer.name.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/lawyers/${editingId}`, formData);
        setMessage("Updated successfully! ✅");
      } else {
        await api.post("/lawyers", formData);
        setMessage("Lawyer added! ✅");
      }
      setFormData({ name: "", email: "", phone: "", specialization: "", experience: "", address: "" });
      setEditingId(null);
      fetchLawyers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving lawyer");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lawyer?")) return;
    try {
      await api.delete(`/lawyers/${id}`);
      fetchLawyers();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="container">
      {/* ADD/EDIT FORM */}
      <div className="card">
        <h2 style={{color: '#0f172a'}}>{editingId ? "📝 Edit Lawyer" : "⚖️ Register Lawyer"}</h2>
        {message && <p className="message success">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input 
              placeholder="Name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
              style={highVisibilityStyle}
            />
            <input 
              placeholder="Email" 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
              style={highVisibilityStyle}
            />
            <input 
              placeholder="Phone" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              style={highVisibilityStyle}
            />
            <input 
              placeholder="Specialization" 
              value={formData.specialization} 
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} 
              style={highVisibilityStyle}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn primary">{editingId ? "Update" : "Add Lawyer"}</button>
          </div>
        </form>
      </div>

      {/* SEARCH BAR SECTION */}
      <div style={{ marginTop: "40px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>⚖️ Registered Lawyers</h2>
        <input 
          type="text" 
          placeholder="Search by ID or Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...highVisibilityStyle, maxWidth: "300px", marginTop: 0 }}
        />
      </div>

      {/* DIRECTORY TABLE */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialization</th>
              <th>Experience</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLawyers.length > 0 ? (
              filteredLawyers.map((lawyer) => (
                <tr key={lawyer.id}>
                  <td><code style={{background: "#eee", padding: "4px 8px", borderRadius: "4px", color: "#333"}}>{lawyer.id}</code></td>
                  <td>
                    <strong style={{color: '#0f172a'}}>{lawyer.name}</strong><br/>
                    <small style={{color: '#64748b'}}>{lawyer.email}</small>
                  </td>
                  <td>{lawyer.specialization}</td>
                  <td>{lawyer.experience || 0} yrs</td>
                  <td>
                    <button className="btn small primary" style={{marginRight: '5px'}} onClick={() => {
                        setFormData(lawyer);
                        setEditingId(lawyer.id);
                        window.scrollTo(0,0);
                    }}>Edit</button>
                    <button className="btn danger small" onClick={() => handleDelete(lawyer.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty">No results found for "{searchTerm}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Lawyer;