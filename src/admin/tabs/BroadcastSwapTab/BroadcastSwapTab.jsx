import React, { useState, useEffect } from "react";
import "./BroadcastSwapTab.css";
import {
  getAllBroadcastsApi,
  createBroadcastApi,
  deleteBroadcastApi,
  getMySwapOffersApi,
} from "../../../services/api";
import { extractTimeFromIso } from "../../../utils/dateUtils";
import { useToast } from "../../../context/ToastContext";

// פונקציות עזר לפירמוט נתונים מחוץ ל-JSX
const formatBroadcastDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("he-IL");
};

const formatSwapOfferData = (offer) => {
  const apt = offer?.appointment;
  const time = extractTimeFromIso(apt?.dateTime);
  const date = apt?.dateTime
    ? new Date(apt.dateTime).toLocaleDateString("he-IL")
    : "";
  const clientName = apt?.user
    ? `${apt.user.firstName || "לקוח"} ${apt.user.lastName || ""}`.trim()
    : "לקוח";
  const serviceName = apt?.service?.name || "תספורת";
  const providerName = apt?.provider?.name || "כללי";

  return {
    id: offer.id,
    title: `${clientName} · ${serviceName}`,
    subtitle: `${time} · ${date} (ספר: ${providerName})`,
  };
};

export default function BroadcastSwapTab() {
  const { showToast } = useToast();
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [swapOffers, setSwapOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [broadcasts, swaps] = await Promise.all([
        getAllBroadcastsApi().catch(() => []),
        getMySwapOffersApi().catch(() => []),
      ]);
      setBroadcastHistory(broadcasts || []);
      setSwapOffers(swaps || []);
    } catch (err) {
      console.error("שגיאה בטעינת נתונים:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    try {
      const newBroadcast = await createBroadcastApi(broadcastText.trim());
      setBroadcastHistory((prev) => [newBroadcast, ...prev]);
      setBroadcastText("");
      showToast("הודעת המערכת שודרה בהצלחה לכל הלקוחות!", "success");
    } catch (err) {
      showToast(err.message || "שגיאה בשידור הודעה", "error");
    }
  };

  const handleDeleteBroadcast = async (id) => {
    try {
      await deleteBroadcastApi(id);
      setBroadcastHistory((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      showToast("שגיאה במחיקת הודעה", "error");
    }
  };

  return (
    <div className="tab-pane">
      <h2 className="pane-title">הודעות ושוק החלפות</h2>

      {/* כרטיס הודעת מערכת לכל הלקוחות */}
      <div className="card-box">
        <div className="box-title">הודעת מערכת לכל הלקוחות</div>
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

        <div className="broadcast-history">
          {broadcastHistory.map((item) => (
            <div key={item.id} className="broadcast-history__item">
              <div className="broadcast-history__content">
                <span className="broadcast-history__text">{item.message}</span>
                <span className="broadcast-history__date">
                  {formatBroadcastDate(item.createdAt)}
                </span>
              </div>
              <button
                onClick={() => handleDeleteBroadcast(item.id)}
                className="broadcast-history__delete-btn"
                title="מחק הודעה"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* כרטיס שוק החלפות בלייב */}
      <div className="card-box">
        <div className="box-title">שוק החלפות בלייב</div>
        {loading ? (
          <div className="empty-state">טוען נתונים...</div>
        ) : swapOffers.length > 0 ? (
          <div className="swap-market-list">
            {swapOffers.map((offer) => {
              const { id, title, subtitle } = formatSwapOfferData(offer);
              return (
                <div key={id} className="swap-market-item">
                  <div className="swap-market-item__details">
                    <span className="swap-market-item__name">{title}</span>
                    <span className="swap-market-item__sub">{subtitle}</span>
                  </div>
                  <span className="badge-status-btn status-confirmed">
                    פעיל
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">אין כרגע תורים מוצעים להחלפה בשוק.</div>
        )}
      </div>
    </div>
  );
}
