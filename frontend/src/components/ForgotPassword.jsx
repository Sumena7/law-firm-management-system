import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../App.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("If that email exists, a reset link has been sent.");
      setError("");
    } catch (err) {
      setError("Failed to send reset email.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{ textAlign: "center" }}>Forgot Password</h2>
        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>Enter your email to receive a password reset link.</p>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" className="btn primary">Send Link</button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link to="/auth/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;