import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const AppointmentNotification = () => {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const res = await api.get("/appointments/pending-count");
      if (res.data.success) {
        setCount(res.data.count);
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (e) => {
    e.preventDefault(); // Stop default browser behavior
    e.stopPropagation(); // Stop event bubbling
    
    console.log("Navigating to /appointments");
    
    // Attempt standard navigation
    navigate("/admin/appointments");
    
    // Fallback: If standard navigate fails (sometimes happens in complex layouts)
    // window.location.href = "/appointments"; 
  };

  if (count === 0) return null;

  return (
    <div 
      className="appt-notif-wrapper" 
      onClick={handleClick}
      style={{ 
        cursor: 'pointer', 
        zIndex: 9999, 
        position: 'relative' 
      }}
    >
      <div className="bell-container">
        <span style={{ fontSize: "1.2rem" }}>🔔</span>
        <span className="notif-badge">{count}</span>
      </div>
      <span className="notif-text">
        {count} New Request{count > 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default AppointmentNotification;