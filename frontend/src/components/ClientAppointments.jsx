import React, { useState, useEffect } from "react";
import api from "../api";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../App.css";

const ClientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lawyersList, setLawyersList] = useState([]);
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState({
    lawyer_id: "",
    date: null, 
    time: "", 
    purpose: "",
    document: null 
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Find the selected lawyer object to access their specific work_days
  const selectedLawyerData = lawyersList.find(l => l.id === parseInt(formData.lawyer_id));

  useEffect(() => { 
    fetchMyAppointments(); 
  }, [user.id]);

  const fetchMyAppointments = async () => {
    if (!user.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/appointments/client/${user.id}`);
      setAppointments(res.data?.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setAppointments([]);
    } finally { 
      setLoading(false); 
    }
  };

  const openModal = async () => {
    setShowModal(true);
    try {
      const res = await api.get("/lawyers/public/list");
      setLawyersList(res.data.data || []);
    } catch (err) {
      console.error("Error loading lawyers:", err);
    }
  };

  // ✅ NEW: Filter function to disable non-working days in the calendar
  const isWorkingDay = (date) => {
    if (!selectedLawyerData || !selectedLawyerData.work_days) return true;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return selectedLawyerData.work_days.includes(dayName);
  };

  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.lawyer_id && formData.date) {
        setLoadingSlots(true);
        try {
          const formattedDate = formData.date.toISOString().split('T')[0];
          const res = await api.get(`/appointments/available-slots/${formData.lawyer_id}/${formattedDate}`);
          setAvailableSlots(res.data.availableSlots || []);
        } catch (err) {
          console.error("Error fetching slots:", err);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      }
    };
    fetchSlots();
  }, [formData.date, formData.lawyer_id]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
        return Swal.fire("Required", "Please select an available date and time slot.", "warning");
    }

    const data = new FormData();
    data.append("assigned_lawyer_id", formData.lawyer_id);
    
    const y = formData.date.getFullYear();
    const m = String(formData.date.getMonth() + 1).padStart(2, '0');
    const d = String(formData.date.getDate()).padStart(2, '0');
    data.append("appointment_date", `${y}-${m}-${d} ${formData.time}`);
    
    data.append("purpose", formData.purpose);
    data.append("status", "Pending");
    if (formData.document) {
        data.append("document", formData.document);
    }

    try {
      const res = await api.post("/appointments", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        Swal.fire({ title: "Request Sent!", icon: "success" });
        setShowModal(false);
        setFormData({ lawyer_id: "", date: null, time: "", purpose: "", document: null });
        setAvailableSlots([]);
        fetchMyAppointments();
      }
    } catch (err) {
      Swal.fire("Booking Error", err.response?.data?.message || "Error booking slot", "error");
    }
  };

  return (
    <div className="card shadow-sm">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>New Consultation Request</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleRequestSubmit}>
              <div className="form-group">
                <label>Legal Specialist</label>
                <select 
                  className="form-input" 
                  required 
                  value={formData.lawyer_id} 
                  onChange={(e) => {
                    setFormData({ ...formData, lawyer_id: e.target.value, date: null, time: "" });
                    setAvailableSlots([]);
                  }}
                >
                  <option value="">-- Select Specialist --</option>
                  {lawyersList.map(l => (
                    <option key={l.id} value={l.id}>Adv. {l.name} ({l.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Preferred Date</label>
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => setFormData({ ...formData, date, time: "" })}
                  minDate={new Date()}
                  filterDate={isWorkingDay} // ✅ Apply the working days filter
                  disabled={!formData.lawyer_id} // ✅ Force lawyer selection first
                  className="form-input"
                  placeholderText={formData.lawyer_id ? "Select an available date" : "Choose a lawyer first"}
                  required
                />
                {formData.lawyer_id && selectedLawyerData && (
                    <small style={{display: 'block', marginTop: '5px', color: '#2563eb'}}>
                        Schedule: {selectedLawyerData.work_days}
                    </small>
                )}
              </div>

              <div className="form-group">
                <label>Available Time Slots</label>
                {loadingSlots ? (
                  <p className="small text-muted">Checking availability...</p>
                ) : formData.date && availableSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${formData.time === slot ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, time: slot })}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : formData.date ? (
                  <p className="small text-danger">No slots available for this day.</p>
                ) : (
                  <p className="small text-muted">Select a date first.</p>
                )}
              </div>
              
              <div className="form-group">
                <label>Reason for Consultation</label>
                <textarea 
                  className="form-input" 
                  value={formData.purpose} 
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Attach Supporting Document</label>
                <input type="file" className="form-input" onChange={(e) => setFormData({...formData, document: e.target.files[0]})} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn primary">Send Request</button>
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Table Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0 }}>📅 My Appointments</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Track your upcoming legal sessions.</p>
        </div>
        <button className="btn primary" onClick={openModal}>+ Request Appointment</button>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>Loading calendar...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Schedule</th>
                <th>Lawyer</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{new Date(app.appointment_date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>{app.lawyer_name ? `Adv. ${app.lawyer_name}` : "Not Assigned"}</td>
                    <td>{app.purpose}</td>
                    <td><span className={`badge ${app.status?.toLowerCase()}`}>{app.status}</span></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{textAlign:'center'}}>No consultation history.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientAppointments;