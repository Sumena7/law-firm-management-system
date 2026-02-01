import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Auth pages
import Login from "./components/login";
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
import LandingPage from "./components/LandingPage";

// Layouts & Dashboards
import AdminDashboard from "./components/AdminDashboard"; 
import LawyerDashboard from "./components/LawyerDashboard";
import ClientDashboard from "./components/ClientDashboard";

// Lawyer Components
import LawyerCases from "./components/LawyerCases";
import LawyerAppointments from "./components/LawyerAppointments";
import LawyerClients from "./components/LawyerClients";
import LawyerDocuments from "./components/LawyerDocuments";
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
    navigate("/"); // Redirect to landing page on logout
    window.location.reload(); 
  };

  return (
    <Routes>
      {/* --- 1. PUBLIC ROUTES (Accessible to everyone) --- */}
      <Route path="/" element={<LandingPage />} /> 
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* --- 2. PROTECTED ROUTES (Requires Login) --- */}
      {isAuthenticated ? (
        <>
          {/* ADMIN FLOW */}
          {role === "admin" && (
            <Route path="/admin" element={<AdminDashboard handleLogout={handleLogout} />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
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
            <Route path="/lawyer-panel" element={<LawyerDashboard handleLogout={handleLogout} />}>
              <Route index element={<Navigate to="/lawyer-panel/dashboard" replace />} />
              <Route path="dashboard" element={<LawyerOverview />} />
              <Route path="cases" element={<LawyerCases />} />
              <Route path="appointments" element={<LawyerAppointments />} />
              <Route path="clients" element={<LawyerClients />} />
              <Route path="documents" element={<LawyerDocuments />} />
            </Route>
          )}

          {/* CLIENT FLOW */}
          {role === "client" && (
            <Route path="/client-panel" element={<ClientDashboard handleLogout={handleLogout} />}>
              <Route index element={<Navigate to="/client-panel/cases" replace />} />
              <Route path="cases" element={<ClientCases />} />
              <Route path="appointments" element={<ClientAppointments />} />
              <Route path="documents" element={<ClientDocuments />} />
              <Route path="lawyers" element={<LawyerDirectory />} />
            </Route>
          )}

          {/* Catch-all for logged in users: if page not found, go to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        /* If NOT logged in and trying to access any dashboard, go to Landing Page */
        <Route path="*" element={<Navigate to="/" replace />} />
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