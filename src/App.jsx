import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminApp from "./AdminApp";
import ClientApp from "./ClientApp";
import RegisterBusiness from "./RegisterBusiness";
import LandingPage from "./LandingPage";
import { TenantProvider } from "./context/TenantContext";
import { ToastProvider } from "./context/ToastContext";
import { refreshTokenApi } from "./services/api";
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

  // חידוש טוקן בשקט (sliding session) - בכל פעם שהאפליקציה נטענת, או
  // חוזרת לפוקוס אחרי שהייתה ברקע, מאריכים את תוקף ההתחברות ב-30 יום
  // נוספים מהרגע הזה. ככה משתמש פעיל כמעט ולא רואה מסך login מחדש, בעוד
  // שמכשיר שלא נעשה בו שימוש פשוט מפסיק להתחדש ונחסם אחרי 30 יום כרגיל -
  // ראו גם auth.js controller (refreshToken) בבקאנד
  useEffect(() => {
    if (!user) return;

    const refresh = async () => {
      try {
        const data = await refreshTokenApi();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } catch (err) {
        // הטוקן כבר לא תקין/פג תוקף - מנתקים בשקט
        handleLogout();
      }
    };

    refresh();

    const handleFocusRefresh = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
    // תלות ב-user?.id בלבד (לא באובייקט user כולו) - אחרת כל חידוש מוצלח
    // (שקורא ל-setUser) היה מפעיל מחדש את ה-effect הזה בלולאה אינסופית
  }, [user?.id]);

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
