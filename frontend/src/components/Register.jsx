import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "client" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/register", formData);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ textAlign: "center" }}>Create Account</h2>
        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="text" placeholder="Full Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input type="email" placeholder="Email" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
          
          <select onChange={(e) => setFormData({...formData, role: e.target.value})}>
            <option value="client">Client</option>
            <option value="lawyer">Lawyer</option>
          </select>

          <button type="submit" className="btn primary">Register</button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account? <Link to="/auth/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;