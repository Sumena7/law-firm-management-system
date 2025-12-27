import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../App.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setMessage("Password updated successfully!");
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>New Password</h2>
        {!token ? (
          <p className="message error">Invalid Token.</p>
        ) : (
          <>
            {message && <p className="message success">{message}</p>}
            {error && <p className="message error">{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <button type="submit" className="btn primary">Reset Password</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;