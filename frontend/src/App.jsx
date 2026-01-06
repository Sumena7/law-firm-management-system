import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Auth pages
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

// Admin Components
import Clients from "./components/Client";
import Lawyers from "./components/Lawyer";
import Cases from "./components/Case";
import Documents from "./components/Document";
import Appointments from "./components/Appointment";
import Billing from "./components/Billing";
import UserManagement from "./components/UserManagement";
import Overview from "./components/Overview"; 

// Layouts & Dashboards
import AdminDashboard from "./components/AdminDashboard"; 
import LawyerDashboard from "./components/LawyerDashboard";
import ClientDashboard from "./components/ClientDashboard";

// Lawyer Components
import LawyerCases from "./components/LawyerCases";
import LawyerAppointments from "./components/LawyerAppointments";
import LawyerClients from "./components/LawyerClients";
import LawyerDocuments from "./components/LawyerDocuments";
// Add this line with your other imports
import LawyerOverview from "./components/LawyerOverview";

// Client Components
import ClientAppointments from "./components/ClientAppointments";
import ClientCases from "./components/ClientCases";
import ClientDocuments from "./components/ClientDocuments";
import LawyerDirectory from "./components/LawyerDirectory";

// Sub-component to handle routing logic and hooks
function AppContent() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const role = user?.role;

  // Global Logout Logic
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
    // Force a reload only if you need to clear all internal React state
    window.location.reload(); 
  };

  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* --- PROTECTED ROUTES --- */}
      {isAuthenticated ? (
        <>
          {/* ADMIN FLOW */}
          {role === "admin" && (
            <Route path="/" element={<AdminDashboard handleLogout={handleLogout} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Overview />} />
              <Route path="cases" element={<Cases />} />
              <Route path="clients" element={<Clients />} />
              <Route path="lawyers" element={<Lawyers />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="invoices" element={<Billing />} />
              <Route path="documents" element={<Documents />} />
              <Route path="admin/users" element={<UserManagement />} />
            </Route>
          )}

        {/* LAWYER FLOW */}
{role === "lawyer" && (
  <Route path="/" element={<LawyerDashboard handleLogout={handleLogout} />}>
    {/* When lawyer logs in, they go to /lawyer/dashboard */}
    <Route index element={<Navigate to="/lawyer/dashboard" replace />} />
    <Route path="lawyer/dashboard" element={<LawyerOverview />} />
    <Route path="lawyer/cases" element={<LawyerCases />} />
    <Route path="lawyer/appointments" element={<LawyerAppointments />} />
    <Route path="lawyer/clients" element={<LawyerClients />} />
    <Route path="lawyer/documents" element={<LawyerDocuments />} />
  </Route>
)}

          {/* CLIENT FLOW */}
          {role === "client" && (
            <Route path="/" element={<ClientDashboard handleLogout={handleLogout} />}>
              <Route index element={<Navigate to="/client/cases" replace />} />
              <Route path="client/cases" element={<ClientCases />} />
              <Route path="client/appointments" element={<ClientAppointments />} />
              <Route path="client/documents" element={<ClientDocuments />} />
              <Route path="client/lawyers" element={<LawyerDirectory />} />
            </Route>
          )}

          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      )}
    </Routes>
  );
}

// Main App component
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;