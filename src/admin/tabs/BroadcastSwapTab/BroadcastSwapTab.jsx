import React, { useState } from "react";

// רכיב ניהול הודעות ושוק החלפות
export default function BroadcastSwapTab() {
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([
    {
      id: 1,
      text: "שעות פתיחה מיוחדות בערב חג - נא לתאם מראש",
      time: "לפני 2 ימים",
    },
  ]);

  // פונקציה לשליחת הודעת מערכת לכל הלקוחות
  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return;
    setBroadcastHistory([
      { id: Date.now(), text: broadcastText.trim(), time: "עכשיו" },
      ...broadcastHistory,
    ]);
    setBroadcastText("");
    alert("הודעת המערכת שודרה בהצלחה לכל הלקוחות!");
  };

  return (
    <div className="tab-pane">
      <h2 className="pane-title">הודעות ושוק החלפות</h2>

      <div className="card-box">
        <div className="box-title" style={{ marginBottom: "8px" }}>
          הודעת מערכת לכל הלקוחות
        </div>
        <textarea
          placeholder="למשל: שעות פתיחה מיוחדות בחג, מבצע סוף שבוע..."
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value)}
          className="admin-textarea"
        />
        <div className="broadcast-send-row">
          <button onClick={handleSendBroadcast} className="btn-primary">
            שליחה לכל הלקוחות
          </button>
        </div>

        <div className="broadcast-history-list">
          {broadcastHistory.map((b) => (
            <div key={b.id} className="history-pill">
              <div className="history-text">{b.text}</div>
              <div className="history-time">{b.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-box" style={{ marginTop: "16px" }}>
        <div className="box-title" style={{ marginBottom: "12px" }}>
          שוק החלפות בלייב
        </div>
        <div className="items-list">
          <div className="item-row">
            <div className="item-details">
              <div className="item-name">עומר יוסף · תספורת גבר</div>
              <div className="item-sub">11:15 · היום</div>
            </div>
            <div className="badge-status-btn status-confirmed">פעיל</div>
            <button className="btn-icon-danger">ביטול הצעה</button>
          </div>
        </div>
      </div>
    </div>
  );
}
