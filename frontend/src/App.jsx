import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

// Lawyer Components
import LawyerDashboard from "./components/LawyerDashboard";
import LawyerCases from "./components/LawyerCases";
import LawyerAppointments from "./components/LawyerAppointments";
import LawyerClients from "./components/LawyerClients"; // ADDED
import LawyerDocuments from "./components/LawyerDocuments";

// Layouts
import DashboardLayout from "./components/DashboardLayout";

function App() {
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const role = user?.role; 

  return (
    <BrowserRouter>
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
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/cases" replace />} />
                <Route path="cases" element={<Cases />} />
                <Route path="clients" element={<Clients />} />
                <Route path="lawyers" element={<Lawyers />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="invoices" element={<Billing />} />
                <Route path="documents" element={<Documents />} />
                <Route path="admin/users" element={<UserManagement />} />
              </Route>
            )}

            {/* LAWYER FLOW - All routes merged here */}
            {role === "lawyer" && (
              <Route path="/" element={<LawyerDashboard />}>
                <Route index element={<Navigate to="/lawyer/cases" replace />} />
                <Route path="lawyer/cases" element={<LawyerCases />} />
                <Route path="lawyer/appointments" element={<LawyerAppointments />} />
                <Route path="lawyer/clients" element={<LawyerClients />} />
                { <Route path="lawyer/documents" element={<LawyerDocuments />} />}
              </Route>
            )}
            
            {/* Fallback for logged in users with no role match */}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </>
        ) : (
          /* NOT LOGGED IN */
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;