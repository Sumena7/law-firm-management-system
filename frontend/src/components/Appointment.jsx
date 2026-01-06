import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";
import Swal from "sweetalert2";

function Appointment() {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    case_id: "",
    assigned_lawyer_id: "",
    client_id: "", 
    appointment_date: "",
    purpose: "",
    status: "Pending" 
  });
  const [editingAppointment, setEditingAppointment] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data.data || []);
    } catch {
      setAppointments([]);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.id.toString().includes(term) || 
      (a.client_name && a.client_name.toLowerCase().includes(term)) ||
      (a.final_client_email && a.final_client_email.toLowerCase().includes(term)) || // Search by Client Email
      (a.lawyer_email && a.lawyer_email.toLowerCase().includes(term)) || // Search by Lawyer Email
      (a.purpose && a.purpose.toLowerCase().includes(term)) ||
      (a.resolved_display_id && a.resolved_display_id.toString().includes(term))
    );
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, formData);
        Swal.fire({
          title: "Updated!",
          text: "Appointment Updated & Notification Sent!",
          icon: "success",
          confirmButtonColor: "#3085d6"
        });
        setEditingAppointment(null);
      } else {
        await api.post("/appointments", formData);
        Swal.fire({
          title: "Booked!",
          text: "Appointment Booked Successfully!",
          icon: "success",
          confirmButtonColor: "#3085d6"
        });
      }
      setFormData({ 
        case_id: "", assigned_lawyer_id: "", client_id: "", 
        appointment_date: "", purpose: "", status: "Pending" 
      });
      fetchAppointments();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Error saving appointment", "error");
    }
  };

  const handleEdit = (a) => {
    setEditingAppointment(a);
    setFormData({
      case_id: a.case_id || "",
      assigned_lawyer_id: a.assigned_lawyer_id || "",
      client_id: a.client_id || "", 
      appointment_date: a.appointment_date ? new Date(a.appointment_date).toISOString().slice(0, 16) : "",
      purpose: a.purpose || "",
      status: a.status || "Pending",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Cancel and notify participants?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6e7881",
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "Keep it"
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchAppointments();
        Swal.fire("Deleted!", "The appointment has been cancelled.", "success");
      } catch {
        Swal.fire("Failed", "Action failed. Please try again.", "error");
      }
    }
  };

  return (
    <div className="container">
      <h2>📅 Appointment Manager</h2>
      
      {/* Form Section */}
      <div className="card shadow-sm">
        <h3>{editingAppointment ? "🔄 Edit & Approve Request" : "🗓️ Create New Appointment"}</h3>
        <form className="form-grid" onSubmit={handleFormSubmit} style={{ marginTop: "15px" }}>
          <div className="form-group">
            <label>
                Client Internal ID 
                {editingAppointment && (
                  <span style={{color: '#2563eb', marginLeft: '10px', fontSize: '0.8rem'}}> 
                    (Editing: {editingAppointment.client_name})
                  </span>
                )}
            </label>
            <input 
                placeholder="User/Client ID" 
                value={formData.client_id} 
                onChange={e => setFormData({ ...formData, client_id: e.target.value })} 
                required 
            />
          </div>
          
          <div className="form-group">
            <label>Lawyer ID</label>
            <input placeholder="Lawyer ID" value={formData.assigned_lawyer_id} onChange={e => setFormData({ ...formData, assigned_lawyer_id: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <input type="datetime-local" value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} required />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select 
              className="form-input"
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Pending">🕒 Pending (Requested)</option>
              <option value="Scheduled">✅ Scheduled (Confirmed)</option>
              <option value="Completed">🏁 Completed</option>
              <option value="Cancelled">❌ Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label>Meeting Purpose</label>
            <input placeholder="e.g. Initial Consultation" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
          </div>
          
          <div className="form-actions" style={{ gridColumn: "span 2" }}>
            <button className="btn primary">{editingAppointment ? "Update & Notify" : "Confirm Booking"}</button>
            {editingAppointment && (
              <button type="button" className="btn secondary" onClick={() => { setEditingAppointment(null); setFormData({ status: "Pending", client_id: "", lawyer_id: "", purpose: "", case_id: "", appointment_date: "" }); }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Header */}
      <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <h3>Upcoming Meetings</h3>
        <input 
          type="text" 
          placeholder="Search Name, Email, or IDs..." 
          className="search-input"
          style={{ width: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Section */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Appt ID</th>
              <th>Participants & Emails</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map(a => (
                <tr key={a.id} className={a.status === 'Pending' ? 'row-pending' : ''}>
                  <td><code>#{a.id}</code></td>
                  <td>
                    <div style={{ marginBottom: "5px" }}>
                      <strong>{a.purpose || "Legal Consultation"}</strong>
                    </div>
                    
                    <small style={{ color: '#64748b', lineHeight: '1.4' }}>
                      <span style={{ fontWeight: '600', color: a.id_type === 'Client' ? '#16a34a' : '#ea580c' }}>
                        {a.id_type}: {a.resolved_display_id}
                      </span> — {a.client_name} <br/>
                      <span style={{ color: '#2563eb' }}>📧 {a.final_client_email}</span>
                      
                      <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                        <strong>Lawyer:</strong> {a.lawyer_name || <span style={{color:'red'}}>Needs Assignment</span>} <br/>
                        {a.lawyer_email && <span style={{ color: '#64748b' }}>📧 {a.lawyer_email}</span>}
                      </div>
                    </small>
                    
                    {a.initial_document && (
                      <div style={{ marginTop: "8px" }}>
                        <a 
                          href={`http://localhost:3000/${a.initial_document}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: "0.78rem", 
                            color: "#2563eb", 
                            fontWeight: "500",
                            textDecoration: "underline"
                          }}
                        >
                          📄 View Client Attachment
                        </a>
                      </div>
                    )}
                  </td>
                  <td>
                    {new Date(a.appointment_date).toLocaleDateString()} <br/>
                    <small>{new Date(a.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                  </td>
                  <td>
                    <span className={`badge ${a.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button className="btn small" onClick={() => handleEdit(a)}>
                        {a.status === 'Pending' ? "Process" : "Edit"}
                      </button>
                      <button className="btn danger small" onClick={() => handleCancel(a.id)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="empty" style={{textAlign:'center', padding:'40px'}}>No appointments found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Appointment;