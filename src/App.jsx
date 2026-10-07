import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminApp from "./AdminApp";
import ClientApp from "./ClientApp";
import RegisterBusiness from "./RegisterBusiness";
import LandingPage from "./LandingPage";
import { TenantProvider } from "./context/TenantContext";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // התנתקות מהחשבון - משותפת לאזור הניהול ולאזור הלקוח
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp user={user} setUser={setUser} onLogout={handleLogout} />
            }
          />
          <Route
            path="/register"
            element={<RegisterBusiness user={user} setUser={setUser} />}
          />
          <Route
            path="/:slug/*"
            element={
              <TenantProvider>
                <ClientApp
                  user={user}
                  setUser={setUser}
                  onLogout={handleLogout}
                />
              </TenantProvider>
            }
          />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
