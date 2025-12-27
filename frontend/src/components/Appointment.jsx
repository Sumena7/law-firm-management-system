import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";

function Appointment() {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    case_id: "",
    assigned_lawyer_id: "",
    client_id: "",
    appointment_date: "",
    purpose: "",
    status: "Scheduled"
  });
  const [message, setMessage] = useState("");
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

  // Search by Appointment ID or Client ID
  const filteredAppointments = appointments.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.id.toString().includes(term) || 
      a.client_id?.toString().includes(term)
    );
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, formData);
        setMessage("Appointment rescheduled! 📅");
        setEditingAppointment(null);
      } else {
        await api.post("/appointments", formData);
        setMessage("Appointment booked! ✅");
      }
      setFormData({ case_id: "", assigned_lawyer_id: "", client_id: "", appointment_date: "", purpose: "", status: "Scheduled" });
      fetchAppointments();
    } catch (err) {
      setMessage("Error saving appointment");
    }
  };

  const handleEdit = (a) => {
    setEditingAppointment(a);
    setFormData({
      case_id: a.case_id || "",
      assigned_lawyer_id: a.assigned_lawyer_id || "",
      client_id: a.client_id || "",
      appointment_date: a.appointment_date?.slice(0, 16) || "",
      purpose: a.purpose || "",
      status: a.status || "Scheduled",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      fetchAppointments();
      setMessage("Appointment cancelled.");
    } catch {
      alert("Action failed.");
    }
  };

  return (
    <div className="container">
      <h2>📅 Appointment Scheduler</h2>
      {message && <p className="message success">{message}</p>}

      {/* Booking Form */}
      <div className="card">
        <h3>{editingAppointment ? "🔄 Reschedule" : "🗓️ Book Appointment"}</h3>
        <form className="form-grid" onSubmit={handleFormSubmit} style={{ marginTop: "15px" }}>
          <input placeholder="Client ID" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })} required />
          <input placeholder="Lawyer ID" value={formData.assigned_lawyer_id} onChange={e => setFormData({ ...formData, assigned_lawyer_id: e.target.value })} required />
          <input placeholder="Case ID (Optional)" value={formData.case_id} onChange={e => setFormData({ ...formData, case_id: e.target.value })} />
          <input type="datetime-local" value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} required />
          <input placeholder="Purpose (e.g. Consultation)" style={{ gridColumn: "span 2" }} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
          
          <div className="form-actions">
            <button className="btn primary">{editingAppointment ? "Update" : "Confirm Booking"}</button>
            {editingAppointment && <button type="button" className="btn" onClick={() => { setEditingAppointment(null); setFormData({}); }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Search Header */}
      <div className="table-header-row">
        <h3>Upcoming Meetings</h3>
        <input 
          type="text" 
          placeholder="Search Appt ID or Client ID..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Appointments Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Details</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map(a => (
                <tr key={a.id}>
                  <td><code>#{a.id}</code></td>
                  <td>
                    <strong>{a.purpose || "Legal Consultation"}</strong><br/>
                    <small>Client: #{a.client_id} | Lawyer: #{a.assigned_lawyer_id}</small>
                  </td>
                  <td>{new Date(a.appointment_date).toLocaleString()}</td>
                  <td><span className={`badge ${a.status?.toLowerCase()}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button className="btn small" onClick={() => handleEdit(a)}>Edit</button>
                      <button className="btn danger small" onClick={() => handleCancel(a.id)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="empty">No appointments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Appointment;