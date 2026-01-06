import { useState, useEffect } from "react";
import api from "../api";
import "../App.css";
import Swal from "sweetalert2";

function Lawyer() {
  const [lawyers, setLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [formData, setFormData] = useState({
    name: "", 
    email: "", 
    phone: "", 
    specialization: "", 
    experience: "", 
    address: "",
    bio: "",
    available_hours: "09:00, 10:00, 11:00, 13:00, 14:00, 15:00" 
  });
  
  // New state for Day Selection
  const [selectedDays, setSelectedDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [editingId, setEditingId] = useState(null);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data: Convert array of days to string for the backend
    const payload = {
      ...formData,
      work_days: selectedDays.join(", ")
    };

    try {
      if (editingId) {
        await api.put(`/lawyers/${editingId}`, payload);
        Swal.fire({ icon: 'success', title: 'Update Successful', text: `${formData.name}'s profile updated.`, timer: 2000, showConfirmButton: false });
      } else {
        await api.post("/lawyers", payload);
        Swal.fire({ icon: 'success', title: 'Lawyer Registered', text: 'New lawyer added with custom schedule.', timer: 2000, showConfirmButton: false });
      }
      
      resetForm();
      fetchLawyers();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Error saving lawyer data", "error");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", specialization: "", experience: "", address: "", bio: "", available_hours: "09:00, 10:00, 11:00, 13:00, 14:00, 15:00" });
    setSelectedDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Remove Lawyer?',
      text: "This will remove them from the directory.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/lawyers/${id}`);
        fetchLawyers();
        Swal.fire('Removed', 'Record deleted.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Could not delete.', 'error');
      }
    }
  };

  const filteredLawyers = lawyers.filter((lawyer) => {
    const term = searchTerm.toLowerCase();
    return lawyer.id.toString().includes(term) || lawyer.name.toLowerCase().includes(term);
  });

  return (
    <div className="container">
      <div className="card shadow-sm">
        <h2 style={{color: '#0f172a'}}>{editingId ? "📝 Edit Lawyer & Schedule" : "⚖️ Register Lawyer"}</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: "15px" }}>
          <div className="form-grid">
            <input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={highVisibilityStyle} />
            <input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required style={highVisibilityStyle} />
            <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={highVisibilityStyle} />

            <select value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} required style={highVisibilityStyle} className="form-input">
              <option value="">-- Select Specialization --</option>
              <option value="Criminal Law">Criminal Law</option>
              <option value="Civil Law">Civil Law</option>
              <option value="Family Law">Family Law</option>
              <option value="Labor & Employment Law">Labor & Employment Law</option>
              <option value="Corporate & Commercial Law">Corporate & Commercial Law</option>
            </select>

            <input placeholder="Experience (Years)" type="number" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} style={highVisibilityStyle} />
            
            <input 
              placeholder="Available Slots (e.g. 09:00, 11:00)" 
              type="text"
              value={formData.available_hours} 
              onChange={(e) => setFormData({ ...formData, available_hours: e.target.value })} 
              style={{...highVisibilityStyle, border: '2px solid #2563eb'}} 
            />

            {/* NEW: Working Days Checkboxes */}
            <div className="form-group" style={{ gridColumn: "span 2", margin: "10px 0" }}>
              <label style={{ fontWeight: '700', marginBottom: '5px', display: 'block' }}>Working Days:</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {daysOfWeek.map(day => (
                  <label key={day} style={{ 
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', 
                    borderRadius: '5px', border: '1px solid #cbd5e1', cursor: 'pointer',
                    backgroundColor: selectedDays.includes(day) ? '#dbeafe' : 'white'
                  }}>
                    <input type="checkbox" checked={selectedDays.includes(day)} onChange={() => handleDayToggle(day)} />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <input placeholder="Office Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{...highVisibilityStyle, gridColumn: "span 2"}} />
            <textarea placeholder="Professional Bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={{ ...highVisibilityStyle, gridColumn: "span 2", minHeight: "80px" }} />
          </div>
          
          <div className="form-actions" style={{ marginTop: "15px" }}>
            <button type="submit" className="btn primary">{editingId ? "Update Lawyer" : "Register Lawyer"}</button>
            {editingId && (
              <button type="button" className="btn secondary" style={{marginLeft: '10px'}} onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container" style={{marginTop: "40px"}}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Professional Info</th>
              <th>Schedule (Days & Hours)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLawyers.map((lawyer) => (
              <tr key={lawyer.id}>
                <td><code>{lawyer.id}</code></td>
                <td>
                  <strong>{lawyer.name}</strong><br/>
                  <small>{lawyer.specialization}</small>
                </td>
                <td>
                  <div style={{fontSize: '0.8rem', color: '#1e293b', fontWeight: 'bold'}}>
                    🗓️ {lawyer.work_days || "Not Set"}
                  </div>
                  <div style={{fontSize: '0.85rem', color: '#2563eb'}}>
                    ⏰ {lawyer.available_hours || "09:00-15:00"}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "5px" }}>
                  <button className="btn small primary" onClick={() => {
    // 1. Set the basic form data
    setFormData({
        name: lawyer.name,
        email: lawyer.email,
        phone: lawyer.phone,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
        address: lawyer.address,
        bio: lawyer.bio || "",
        available_hours: lawyer.available_hours || ""
    });

    // 2. FIX: Completely overwrite selectedDays. 
    // Do not use [...prev]. We want to start fresh with ONLY what is in the DB.
    if (lawyer.work_days) {
        // This splits the string and removes extra spaces/duplicates
        const cleanDays = lawyer.work_days
            .split(",")
            .map(d => d.trim())
            .filter((value, index, self) => self.indexOf(value) === index && value !== "");
        
        setSelectedDays(cleanDays);
    } else {
        setSelectedDays([]); // If no days exist, start empty
    }

    setEditingId(lawyer.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
}}>Edit</button>
                    <button className="btn danger small" onClick={() => handleDelete(lawyer.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Lawyer;