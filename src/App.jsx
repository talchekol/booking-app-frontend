import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminApp from "./AdminApp";
import ClientApp from "./ClientApp";
import RegisterBusiness from "./RegisterBusiness";
import { TenantProvider } from "./context/TenantContext";
import "./App.css";

// עסק ברירת המחדל שאליו מפנים כניסה לכתובת השורש (בלי slug בכתובת) -
// זמני עד שתיבנה מסך "בחר עסק" אמיתי או שהמערכת תדע להפנות אוטומטית
const DEFAULT_SLUG = "tal-barber";

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
        <Route
          path="/"
          element={<Navigate to={`/${DEFAULT_SLUG}`} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={`/${DEFAULT_SLUG}`} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
