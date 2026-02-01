import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // ROLE-BASED NAVIGATION - Updated to match new App.jsx routes
        if (user.role === 'lawyer') {
          navigate("/lawyer-panel/dashboard"); 
        } else if (user.role === 'admin') {
          navigate("/admin/dashboard");
        } else if (user.role === 'client') {
          navigate("/client-panel/cases");
        } else {
          navigate("/");
        }

        window.location.reload(); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ textAlign: "center", color: "var(--primary)" }}>Everest Law Chamber</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
          Login to your account
        </p>

        {error && <p className="message error">{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@firm.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem" }}>
          <Link to="/auth/forgot-password" style={{ color: "var(--primary)", textDecoration: "none" }}>
            Forgot Password?
          </Link>
          <p style={{ marginTop: "10px", color: "#64748b" }}>
            Don't have an account? <Link to="/auth/register" style={{ color: "var(--primary)", fontWeight: "600" }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;