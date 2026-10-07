import React, { useState, useEffect } from "react";
import {
  Repeat,
  Bell,
  Megaphone,
  Loader2,
  Check,
  X,
  CheckCircle2,
} from "lucide-react";
import "./Messages.css";
import {
  getMySwapRequestsApi,
  approveSwapRequestApi,
  rejectSwapRequestApi,
  getActiveBroadcastApi,
} from "../../services/api";
import { extractTimeFromIso } from "../../utils/dateUtils";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";

// פירמוט ישיר של מחרוזת ה-ISO ללא הזזת שעות
const formatDateTime = (isoString) => {
  if (!isoString || typeof isoString !== "string" || !isoString.includes("T")) {
    return "";
  }
  const [datePart] = isoString.split("T");
  const [year, month, day] = datePart.split("-");
  const time = extractTimeFromIso(isoString);
  return `${day}/${month}/${year} בשעה ${time}`;
};

const formatIncomingItem = (req) => ({
  id: req.id,
  status: req.status,
  senderName: req.requester?.firstName || "לקוח/ה",
  offeredService: req.offeredAppointment?.service?.name || "תספורת",
  offeredTime: formatDateTime(req.offeredAppointment?.dateTime),
  myTime: formatDateTime(req.ownerAppointment?.dateTime),
});

const formatOutgoingItem = (req) => ({
  id: req.id,
  status: req.status,
  targetTime: formatDateTime(req.ownerAppointment?.dateTime),
  ownerName: req.owner?.firstName || "הצד השני",
});

export default function Messages({ onAppointmentUpdated }) {
  const { slug } = useTenant();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("swaps");
  const [swapRequests, setSwapRequests] = useState({
    incoming: [],
    outgoing: [],
  });
  const [broadcastNotice, setBroadcastNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [swapsData, broadcastData] = await Promise.all([
        getMySwapRequestsApi().catch(() => ({ incoming: [], outgoing: [] })),
        getActiveBroadcastApi(slug).catch(() => null),
      ]);
      setSwapRequests(swapsData || { incoming: [], outgoing: [] });
      setBroadcastNotice(broadcastData);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await approveSwapRequestApi(requestId);
      showToast("ההחלפה אושרה בהצלחה! התורים עודכנו אצל שניכם.", "success");

      // 1. ריענון הנתונים במסך ההודעות
      await loadData();

      // 2. ריענון ה-State של כל האפליקציה (התור העדכני של הלקוח)
      if (typeof onAppointmentUpdated === "function") {
        await onAppointmentUpdated();
      }
    } catch (err) {
      showToast(err.message || "שגיאה באישור ההחלפה", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await rejectSwapRequestApi(requestId);
      await loadData();
    } catch (err) {
      showToast(err.message || "שגיאה בדחיית ההחלפה", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const incomingList = (swapRequests.incoming || []).map(formatIncomingItem);
  const outgoingList = (swapRequests.outgoing || []).map(formatOutgoingItem);
  const pendingCount = incomingList.filter(
    (item) => item.status === "PENDING",
  ).length;

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
          {pendingCount > 0 && (
            <span className="incoming-badge">{pendingCount}</span>
          )}
        </button>
        <button
          className={`messages-tab-btn ${activeTab === "system" ? "active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          <Bell size={16} />
          <span>התראות מערכת</span>
          {broadcastNotice && <span className="incoming-dot" />}
        </button>
      </div>

      {activeTab === "swaps" && (
        <div className="messages-list">
          {loading ? (
            <div className="messages-loader">
              <Loader2 className="spinner" size={20} />
              <span>טוען עדכוני החלפה...</span>
            </div>
          ) : (
            <>
              {/* בקשות נכנסות */}
              {incomingList.length > 0 && (
                <div className="requests-group">
                  <div className="group-label">בקשות שקיבלת</div>
                  {incomingList.map((req) => (
                    <div
                      key={req.id}
                      className={`message-card ${req.status === "PENDING" ? "unread" : ""}`}
                    >
                      <div className="message-icon-wrapper swap">
                        <Repeat size={20} />
                      </div>
                      <div className="message-body message-body-full">
                        <div className="message-title-row">
                          <span className="message-item-title">
                            {req.status === "APPROVED"
                              ? `החלפת תור עם ${req.senderName} הושלמה! 🎉`
                              : `בקשת החלפה מ${req.senderName} 🔄`}
                          </span>
                          <span className="message-time">
                            {req.status === "PENDING"
                              ? "ממתין לתשובתך"
                              : req.status === "APPROVED"
                                ? "אושר"
                                : "בוטל"}
                          </span>
                        </div>
                        <p className="message-text swap-details-text">
                          <strong>תור מוצע:</strong> {req.offeredTime} (
                          {req.offeredService})
                          <br />
                          <strong>התור שלך:</strong> {req.myTime}
                        </p>

                        {req.status === "PENDING" && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* בקשות יוצאות */}
              {outgoingList.length > 0 && (
                <div className="requests-group">
                  <div className="group-label">בקשות ששלחת</div>
                  {outgoingList.map((req) => (
                    <div key={req.id} className="message-card">
                      <div className="message-icon-wrapper swap">
                        <Repeat size={20} />
                      </div>
                      <div className="message-body">
                        <div className="message-title-row">
                          <span className="message-item-title">
                            {req.status === "APPROVED"
                              ? `${req.ownerName} אישר/ה את בקשת ההחלפה שלך והתורים הוחלפו בהצלחה! 🎉`
                              : "בקשת החלפה שנשלחה"}
                          </span>
                          <span className="message-time">
                            {req.status === "PENDING"
                              ? "ממתין לאישור"
                              : req.status === "APPROVED"
                                ? "אושר"
                                : "נדחה"}
                          </span>
                        </div>
                        <p className="message-text">
                          עבור תור ב-{req.targetTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {incomingList.length === 0 && outgoingList.length === 0 && (
                <p className="no-messages">אין עדכוני החלפות כרגע.</p>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "system" && (
        <div className="messages-list">
          {broadcastNotice ? (
            <div className="message-card unread">
              <div className="message-icon-wrapper broadcast">
                <Megaphone size={20} />
              </div>
              <div className="message-body">
                <div className="message-title-row">
                  <span className="message-item-title">
                    הודעת מערכת מהמספרה ✂️
                  </span>
                </div>
                <p className="message-text">{broadcastNotice.message}</p>
              </div>
            </div>
          ) : (
            <p className="no-messages">אין התראות מערכת פעילות כרגע.</p>
          )}
        </div>
      )}
    </div>
  );
}
