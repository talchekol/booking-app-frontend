import React, { useState } from "react";
import { User, Bell, Repeat, LogOut, ShieldCheck } from "lucide-react";
import "./Profile.css";

export default function Profile({ user, onLogout }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [swapAlertsEnabled, setSwapAlertsEnabled] = useState(true);

  return (
    <div className="profile-container">
      {/* כותרת */}
      <div className="profile-header">
        <h2 className="profile-title">הפרופיל שלי 👤</h2>
      </div>

      {/* 1. כרטיסיית פרטי המשתמש */}
      <div className="user-info-card">
        <div className="profile-avatar">
          {user?.firstName ? user.firstName.charAt(0) : <User size={24} />}
        </div>
        <div className="user-details">
          <span className="user-name-text">
            {user?.firstName
              ? `${user.firstName} ${user.lastName || ""}`
              : "יוסי כהן"}
          </span>
          <span className="user-phone-text">
            {user?.phone || "050-1234567"}
          </span>
        </div>
      </div>

      {/* 2. הגדרות התראות והעדפות - מוסתר זמנית: אין עדיין מנגנון אמיתי
      שמחובר למתגים האלה (לא שולח שום תזכורת/התראה בפועל). משאירים את הקוד
      כמו שהוא לקראת חיבור עתידי להתראות אמיתיות בטלפון, רק לא מציגים
      למשתמש הבטחה על פיצ'ר שעדיין לא קיים.
      <div className="settings-section">
        <div className="section-title-text">הגדרות והתראות</div>

        <div className="setting-row">
          <div className="setting-info">
            <Bell size={18} className="setting-icon" />
            <div className="setting-text">
              <span className="setting-label">תזכורות לתורים</span>
              <span className="setting-desc">קבלת התראה לפני תור קרוב</span>
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <Repeat size={18} className="setting-icon" />
            <div className="setting-text">
              <span className="setting-label">עדכוני החלפות</span>
              <span className="setting-desc">התראה כשמשתמש מציע החלפה</span>
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={swapAlertsEnabled}
              onChange={() => setSwapAlertsEnabled(!swapAlertsEnabled)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      */}

      {/* 3. כפתור התנתקות */}
      <button onClick={onLogout} className="logout-button">
        <LogOut size={18} />
        <span>התנתק מהחשבון</span>
      </button>
    </div>
  );
}
