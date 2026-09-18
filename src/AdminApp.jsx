import React, { useState, useEffect } from "react";
import LoginSMS from "./components/LoginSMS/LoginSMS";
import AdminDashboard from "./admin/AdminDashboard";
import { getBusinessProfileApi } from "./services/api";

// אזור הניהול - בלי slug בנתיב, זהות העסק נגזרת מהטוקן של המנהל המחובר
export default function AdminApp({ user, setUser, onLogout }) {
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const loadBusinessProfile = async () => {
      try {
        const data = await getBusinessProfileApi();
        if (data) setBusinessInfo(data);
      } catch (err) {
        console.error("שגיאה בטעינת פרטי העסק:", err);
      }
    };

    loadBusinessProfile();
  }, [user]);

  if (!user) {
    return <LoginSMS onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  if (user.role !== "ADMIN") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>הכניסה לאזור זה מותרת למנהלים בלבד.</p>
        <button onClick={onLogout}>התנתקות</button>
      </div>
    );
  }

  return (
    <div className="admin-app-wrapper">
      <AdminDashboard
        businessName={businessInfo?.name || "המספרה"}
        businessInfo={businessInfo}
        onBusinessUpdated={(updated) => setBusinessInfo(updated)}
        onLogout={onLogout}
      />
    </div>
  );
}
