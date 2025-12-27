import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

function Client() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // For searching by ID or Name
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data.data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setClients([]);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // --- Search Logic ---
  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.id.toString().includes(term) || 
      client.name.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        setMessage("Client updated successfully! ✅");
      } else {
        await api.post("/clients", formData);
        setMessage("Client added successfully! ✅");
      }
      setFormData({ name: "", email: "", phone: "", address: "" });
      setEditingId(null);
      fetchClients();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving client");
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
    });
    setEditingId(client.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
      setMessage("Client deleted. 🗑️");
    } catch (err) {
      alert("Delete failed.");
    }
  };

  return (
    <div className="container">
      <h2>👥 Client Management</h2>
      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}

      {/* Add/Edit Form Card */}
      <div className="card">
        <h3>{editingId ? "📝 Edit Client" : "➕ Add New Client"}</h3>
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: "15px" }}>
          <input
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <input
            placeholder="Home/Office Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editingId ? "Update Client" : "Save Client"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", email: "", phone: "", address: "" });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Header Row */}
      <div className="table-header-row">
        <h3>Client List</h3>
        <input 
          type="text" 
          placeholder="Search by ID or Name..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Clients Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client Name</th>
              <th>Contact Info</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td><code>#{client.id}</code></td>
                  <td><strong>{client.name}</strong></td>
                  <td>
                    {client.email}<br/>
                    <small style={{ color: "#666" }}>{client.phone}</small>
                  </td>
                  <td>{client.address || "N/A"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button className="btn small" onClick={() => handleEdit(client)}>Edit</button>
                      <button className="btn danger small" onClick={() => handleDelete(client.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty">
                  {searchTerm ? `No results found for "${searchTerm}"` : "No clients registered yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Client;