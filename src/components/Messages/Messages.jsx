import React, { useState, useEffect } from "react";
import { Repeat, Bell, Megaphone, CheckCircle2, Clock } from "lucide-react";
import "./Messages.css";
import {
  getMySwapRequestsApi,
  approveSwapRequestApi,
  rejectSwapRequestApi,
} from "../../services/api";
import { Loader2, Check, X } from "lucide-react";

const formatApptDateTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("he-IL");
  const time = d.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} בשעה ${time}`;
};

export default function Messages() {
  const [activeTab, setActiveTab] = useState("swaps"); // 'swaps' | 'system'
  const [swapRequests, setSwapRequests] = useState({
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

  // שליפת בקשות החלפה חיות מהשרת
  const loadSwapRequests = async () => {
    setLoading(true);
    try {
      const data = await getMySwapRequestsApi();
      setSwapRequests(data || { incoming: [], outgoing: [] });
    } catch (err) {
      console.error("שגיאה בטעינת הודעות החלפה:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwapRequests();
  }, []);

  // אישור החלפה
  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await approveSwapRequestApi(requestId);
      alert("ההחלפה אושרה בהצלחה! התור עודכן.");
      await loadSwapRequests();
      if (onAppointmentUpdated) onAppointmentUpdated();
    } catch (err) {
      alert(err.message || "שגיאה באישור ההחלפה");
    } finally {
      setActionLoadingId(null);
    }
  };

  // דחיית החלפה
  const handleReject = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await rejectSwapRequestApi(requestId);
      await loadSwapRequests();
    } catch (err) {
      alert(err.message || "שגיאה בדחיית ההחלפה");
    } finally {
      setActionLoadingId(null);
    }
  };

  const incomingCount = swapRequests.incoming?.length || 0;

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2 className="messages-title">הודעות והתראות 🔔</h2>
      </div>

      <div className="messages-tabs-bar">
        <button
          className={`messages-tab-btn ${activeTab === "swaps" ? "active" : ""}`}
          onClick={() => setActiveTab("swaps")}
        >
          <Repeat size={16} />
          <span>עדכוני החלפות</span>
          {incomingCount > 0 && (
            <span className="incoming-badge">{incomingCount}</span>
          )}
        </button>
        <button
          className={`messages-tab-btn ${activeTab === "system" ? "active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          <Bell size={16} />
          <span>התראות מערכת</span>
        </button>
      </div>

      {activeTab === "swaps" && (
        <div className="messages-list">
          {loading ? (
            <div className="messages-loader">
              <Loader2 className="spinner" size={20} />
              <span>טוען בקשות החלפה...</span>
            </div>
          ) : (
            <>
              {swapRequests.incoming && swapRequests.incoming.length > 0 && (
                <div className="requests-group">
                  {swapRequests.incoming.map((req) => {
                    const senderName =
                      req.requesterAppt?.user?.firstName || "משתמש";
                    const offeredService =
                      req.requesterAppt?.service?.name || "תספורת";
                    const offeredTime = formatApptDateTime(
                      req.requesterAppt?.dateTime,
                    );
                    const myTime = formatApptDateTime(req.targetAppt?.dateTime);

                    return (
                      <div key={req.id} className="message-card unread">
                        <div className="message-icon-wrapper swap">
                          <Repeat size={20} />
                        </div>
                        <div className="message-body message-body-full">
                          <div className="message-title-row">
                            <span className="message-item-title">
                              בקשת החלפה מ{senderName} 🔄
                            </span>
                            <span className="message-time">ממתין לתשובתך</span>
                          </div>
                          <p className="message-text swap-details-text">
                            <strong>מציע/ה בתמורה:</strong> {offeredTime} (
                            {offeredService})<br />
                            <strong>עבור התור שלך:</strong> {myTime}
                          </p>

                          <div className="message-actions-row">
                            <button
                              className="swap-approve-btn"
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoadingId === req.id}
                            >
                              <Check size={14} />
                              אישור החלפה
                            </button>
                            <button
                              className="swap-reject-btn"
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoadingId === req.id}
                            >
                              <X size={14} />
                              דחייה
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {swapRequests.outgoing && swapRequests.outgoing.length > 0 && (
                <div className="requests-group">
                  {swapRequests.outgoing.map((req) => (
                    <div key={req.id} className="message-card">
                      <div className="message-icon-wrapper swap">
                        <Repeat size={20} />
                      </div>
                      <div className="message-body">
                        <div className="message-title-row">
                          <span className="message-item-title">
                            בקשת החלפה ששלחת
                          </span>
                          <span className="message-time">{req.status}</span>
                        </div>
                        <p className="message-text">
                          שלחת בקשה להחלפה לתאריך{" "}
                          {formatApptDateTime(req.targetAppt?.dateTime)}.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(!swapRequests.incoming || swapRequests.incoming.length === 0) &&
                (!swapRequests.outgoing ||
                  swapRequests.outgoing.length === 0) && (
                  <p className="no-messages">אין בקשות החלפה פעילות כרגע.</p>
                )}
            </>
          )}
        </div>
      )}

      {}
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
