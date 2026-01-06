import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";
// Import SweetAlert2
import Swal from "sweetalert2";

function Client() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
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

  // Filter logic remains the same
  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.id.toString().includes(term) || 
      client.name.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Client details have been updated.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await api.post("/clients", formData);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'New client added to the database.',
          timer: 2000,
          showConfirmButton: false
        });
      }
      setFormData({ name: "", email: "", phone: "", address: "" });
      setEditingId(null);
      fetchClients();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.response?.data?.message || "Error saving client",
      });
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

  // --- REFACTORED DELETE WITH SWEETALERT2 ---
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This client record will be permanently removed!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
        Swal.fire(
          'Deleted!',
          'The client has been deleted.',
          'success'
        );
      } catch (err) {
        Swal.fire(
          'Failed!',
          'Could not delete the client. They might be linked to active cases.',
          'error'
        );
      }
    }
  };

  return (
    <div className="container">
      <h2>👥 Client Management</h2>

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
      <div className="table-header-row" style={{ marginTop: '30px' }}>
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
                <td colSpan="5" className="empty" style={{ textAlign: 'center', padding: '20px' }}>
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