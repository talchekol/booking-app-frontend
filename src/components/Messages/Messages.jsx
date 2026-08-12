import React, { useState } from "react";
import { Repeat, Bell, Megaphone, CheckCircle2, Clock } from "lucide-react";
import "./Messages.css";

export default function Messages() {
  const [activeTab, setActiveTab] = useState("swaps"); // 'swaps' | 'system'

  // נתוני דמו של הודעות החלפה
  const swapNotifications = [
    {
      id: 1,
      title: "בקשת החלפה חדשה 🔄",
      text: "עידו לוי מעוניין להחליף איתך תור לתאריך 04/08/2026 בשעה 18:00.",
      time: "לפני 10 דקות",
      unread: true,
      type: "swap",
    },
    {
      id: 2,
      title: "ההצעה שלך פורסמה!",
      text: "התור שלך בתאריך 02/08/2026 בשעה 09:00 הוצג בהצלחה בשוק ההחלפות.",
      time: "לפני שעה",
      unread: false,
      type: "swap",
    },
  ];

  // נתוני דמו של התראות מערכת והודעות מהמספרה
  const systemNotifications = [
    {
      id: 101,
      title: "התור נקבע בהצלחה! 🎉",
      text: "נקבע לך תור לתספורת גברים עם דניאל לתאריך 02/08/2026 בשעה 09:00.",
      time: "אתמול",
      unread: false,
      type: "system",
    },
    {
      id: 102,
      title: "עדכון חגים מהמספרה ✂️",
      text: "לקוחות יקרים, בערב ראש השנה המספרה תפעל במתכונת מורחבת. מומלץ להקדים ולקבוע תורים!",
      time: "לפני 3 ימים",
      unread: false,
      type: "broadcast",
    },
  ];

  return (
    <div className="messages-container">
      {/* כותרת */}
      <div className="messages-header">
        <h2 className="messages-title">הודעות והתראות 🔔</h2>
      </div>

      {/* סרגל לשוניות */}
      <div className="messages-tabs-bar">
        <button
          className={`messages-tab-btn ${activeTab === "swaps" ? "active" : ""}`}
          onClick={() => setActiveTab("swaps")}
        >
          <Repeat size={16} />
          <span>עדכוני החלפות</span>
        </button>
        <button
          className={`messages-tab-btn ${activeTab === "system" ? "active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          <Bell size={16} />
          <span>התראות מערכת</span>
        </button>
      </div>

      {/* לשונית 1: עדכוני החלפות */}
      {activeTab === "swaps" && (
        <div className="messages-list">
          {swapNotifications.length > 0 ? (
            swapNotifications.map((msg) => (
              <div
                key={msg.id}
                className={`message-card ${msg.unread ? "unread" : ""}`}
              >
                <div className="message-icon-wrapper swap">
                  <Repeat size={20} />
                </div>
                <div className="message-body">
                  <div className="message-title-row">
                    <span className="message-item-title">{msg.title}</span>
                    <span className="message-time">{msg.time}</span>
                  </div>
                  <p className="message-text">{msg.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-messages">אין הודעות החלפה כרגע.</p>
          )}
        </div>
      )}

      {/* לשונית 2: התראות מערכת */}
      {activeTab === "system" && (
        <div className="messages-list">
          {systemNotifications.length > 0 ? (
            systemNotifications.map((msg) => (
              <div key={msg.id} className="message-card">
                <div
                  className={`message-icon-wrapper ${
                    msg.type === "broadcast" ? "broadcast" : "system"
                  }`}
                >
                  {msg.type === "broadcast" ? (
                    <Megaphone size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
                <div className="message-body">
                  <div className="message-title-row">
                    <span className="message-item-title">{msg.title}</span>
                    <span className="message-time">{msg.time}</span>
                  </div>
                  <p className="message-text">{msg.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-messages">אין התראות מערכת כרגע.</p>
          )}
        </div>
      )}
    </div>
  );
}
