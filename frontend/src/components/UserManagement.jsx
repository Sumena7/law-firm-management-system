import { useState } from "react";
import api from "../api";
import "../App.css";

function UserManagement() {
  const [staffData, setStaffData] = useState({ name: "", email: "", password: "" });
  const [lawyerData, setLawyerData] = useState({ name: "", email: "", specialization: "" });
  const [message, setMessage] = useState("");

  const inputStyle = {
    backgroundColor: 'white',
    color: 'black',
    border: '2px solid #94a3b8',
    fontWeight: '600',
    WebkitTextFillColor: 'black'
  };

  // Handle Staff Creation (Option 1)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/admin/create-staff", staffData);
      setMessage(`✅ ${res.data.message}`);
      setStaffData({ name: "", email: "", password: "" });
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.message || "Failed to create staff"));
    }
  };

  // Handle Lawyer Authorization (Existing Logic)
  const handleAuthorizeLawyer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/admin/authorize-lawyer", lawyerData);
      setMessage(`✅ ${res.data.message}`);
      setLawyerData({ name: "", email: "", specialization: "" });
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.message || "Failed to authorize lawyer"));
    }
  };

  return (
    <div className="container">
      <h2 style={{color: '#0f172a'}}>🛡️ Admin User Management</h2>
      {message && <p className="message info" style={{padding: '10px', borderRadius: '5px', background: '#e0f2fe'}}>{message}</p>}

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* SECTION 1: CREATE STAFF */}
        <div className="card">
          <h3>👥 Create Staff Account</h3>
          <p><small>Directly creates a user in the database with <b>Staff</b> role.</small></p>
          <form onSubmit={handleCreateStaff}>
            <input 
              placeholder="Staff Name" 
              value={staffData.name} 
              onChange={e => setStaffData({...staffData, name: e.target.value})} 
              required style={inputStyle} 
            />
            <input 
              placeholder="Staff Email" 
              type="email" 
              value={staffData.email} 
              onChange={e => setStaffData({...staffData, email: e.target.value})} 
              required style={inputStyle} 
            />
            <input 
              placeholder="Temporary Password" 
              type="text" 
              value={staffData.password} 
              onChange={e => setStaffData({...staffData, password: e.target.value})} 
              required style={inputStyle} 
            />
            <button type="submit" className="btn primary" style={{marginTop: '10px'}}>Create Staff Account</button>
          </form>
        </div>

        {/* SECTION 2: AUTHORIZE LAWYER */}
        <div className="card">
          <h3>⚖️ Authorize Lawyer Email</h3>
          <p><small>Adds email to authorized list so they can <b>Register</b> themselves.</small></p>
          <form onSubmit={handleAuthorizeLawyer}>
            <input 
              placeholder="Lawyer Name" 
              value={lawyerData.name} 
              onChange={e => setLawyerData({...lawyerData, name: e.target.value})} 
              required style={inputStyle} 
            />
            <input 
              placeholder="Lawyer Email" 
              type="email" 
              value={lawyerData.email} 
              onChange={e => setLawyerData({...lawyerData, email: e.target.value})} 
              required style={inputStyle} 
            />
            <input 
              placeholder="Specialization" 
              value={lawyerData.specialization} 
              onChange={e => setLawyerData({...lawyerData, specialization: e.target.value})} 
              style={inputStyle} 
            />
            <button type="submit" className="btn primary" style={{marginTop: '10px'}}>Authorize Lawyer</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default UserManagement;