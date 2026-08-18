import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Clock,
  XCircle,
  CheckCircle,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";
import {
  fetchAvailableSwapsApi,
  getMySwapRequestsApi,
  approveSwapRequestApi,
  rejectSwapRequestApi,
} from "../../services/api";
import "./Swaps.css";

// פונקציות עזר דינמיות לחילוץ בטוח של שדות התור
const getServiceName = (appt) =>
  appt?.service?.name ||
  (typeof appt?.service === "string" ? appt.service : "תספורת");

const getBarberName = (appt) =>
  appt?.provider?.name ||
  appt?.barber?.name ||
  (typeof appt?.barber === "string" ? appt.barber : "ספר");

const formatApptDate = (appt) => {
  if (appt?.dateTime) {
    return new Date(appt.dateTime).toLocaleDateString("he-IL");
  }
  return appt?.date || "";
};

const formatApptTime = (appt) => {
  if (appt?.dateTime) {
    return new Date(appt.dateTime).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return appt?.time || "";
};

const getUserDisplayName = (user) => {
  if (user?.firstName) {
    return `${user.firstName} ${user.lastName || ""}`.trim();
  }
  return "משתמש";
};

export default function Swaps({
  myAppointment,
  onToggleSwapOffer,
  onRequestSwap,
  pendingSwapId,
  onSwapChanged,
}) {
  const [availableSwaps, setAvailableSwaps] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // טעינת תורים זמינים להחלפה + בקשות ההחלפה שלי מה-Backend
  const loadMarketSwaps = async () => {
    setLoading(true);
    try {
      const [swaps, requests] = await Promise.all([
        fetchAvailableSwapsApi(),
        getMySwapRequestsApi(),
      ]);
      setAvailableSwaps(Array.isArray(swaps) ? swaps : []);
      setIncomingRequests(Array.isArray(requests?.incoming) ? requests.incoming : []);
      setOutgoingRequests(Array.isArray(requests?.outgoing) ? requests.outgoing : []);
    } catch (err) {
      console.error("שגיאה בטעינת נתוני שוק ההחלפות:", err);
      setAvailableSwaps([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // מתרענן מחדש גם אם ה-tab נשאר פתוח ומצב ההצעה של המשתמש/ההצעה הממתינה משתנה
  // (למשל ביטול הצעה מדף הבית בזמן שה-tab הזה עדיין מחובר)
  useEffect(() => {
    loadMarketSwaps();
  }, [myAppointment?.isUpForSwap, pendingSwapId]);

  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await approveSwapRequestApi(requestId);
      await loadMarketSwaps();
      if (onSwapChanged) onSwapChanged();
    } catch (err) {
      console.error("שגיאה באישור ההחלפה:", err);
      alert(err.message || "אירעה שגיאה באישור ההחלפה, אנא נסה שוב");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await rejectSwapRequestApi(requestId);
      await loadMarketSwaps();
    } catch (err) {
      console.error("שגיאה בעדכון בקשת ההחלפה:", err);
      alert(err.message || "אירעה שגיאה, אנא נסה שוב");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="swaps-container">
      {/*header*/}
      <div className="screen-header">
        <h2 className="screen-title">שוק החלפות תורים 🔄</h2>
      </div>

      {/* 1. ההצעה הפעילה שלי */}
      <div className="section-label">
        <ArrowLeftRight size={18} />
        <span>ההצעה שלי</span>
      </div>

      {myAppointment && myAppointment.isUpForSwap ? (
        <div className="my-offer-card">
          <div className="my-offer-header">
            <span className="badge-offer">מוצע להחלפה בלייב</span>
            <button onClick={onToggleSwapOffer} className="cancel-offer-btn">
              <XCircle size={14} />
              בטל הצעה
            </button>
          </div>
          <div className="offer-details">
            <div className="offer-info">
              <span className="offer-title">
                {getServiceName(myAppointment)} (עם{" "}
                {getBarberName(myAppointment)})
              </span>
              <span className="offer-time">
                {formatApptDate(myAppointment)} בשעה{" "}
                {formatApptTime(myAppointment)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.875rem",
            marginBottom: "20px",
          }}
        >
          {myAppointment
            ? 'התור שלך עדיין לא מוצע להחלפה. לחץ "הצע להחלפה" בדף הבית כדי להציע אותו.'
            : "אין לך תור פעיל להציע להחלפה."}
        </p>
      )}

      {/* 2. בקשות החלפה שקיבלתי מאחרים על ההצעה שלי */}
      {incomingRequests.length > 0 && (
        <>
          <div className="section-label">
            <Clock size={18} />
            <span>בקשות החלפה שקיבלת</span>
          </div>
          <div className="swaps-list">
            {incomingRequests.map((req) => {
              const requesterName = getUserDisplayName(req.requester);
              const offered = req.offeredAppointment;
              const isBusy = actionLoadingId === req.id;

              return (
                <div key={req.id} className="swap-item-card">
                  <div className="user-swap-info">
                    <div className="avatar-circle">
                      {requesterName.charAt(0)}
                    </div>
                    <div className="swap-text">
                      <span className="user-name">
                        {requesterName} מציע/ה • {getServiceName(offered)}
                      </span>
                      <span className="swap-time-badge">
                        {formatApptDate(offered)} בשעה {formatApptTime(offered)}
                      </span>
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      className="approve-request-btn"
                      onClick={() => handleApprove(req.id)}
                      disabled={isBusy}
                      title="אשר החלפה"
                    >
                      {isBusy ? (
                        <Loader2 className="spinner" size={14} />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                    </button>
                    <button
                      className="decline-request-btn"
                      onClick={() => handleReject(req.id)}
                      disabled={isBusy}
                      title="דחה בקשה"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 3. בקשות החלפה שאני שלחתי וממתינות לאישור */}
      {outgoingRequests.length > 0 && (
        <>
          <div className="section-label">
            <RefreshCw size={18} />
            <span>הבקשות שלך הממתינות לאישור</span>
          </div>
          <div className="swaps-list">
            {outgoingRequests.map((req) => {
              const targetAppt = req.swapOffer?.appointment;
              const ownerName = getUserDisplayName(targetAppt?.user);
              const isBusy = actionLoadingId === req.id;

              return (
                <div key={req.id} className="swap-item-card">
                  <div className="user-swap-info">
                    <div className="avatar-circle">{ownerName.charAt(0)}</div>
                    <div className="swap-text">
                      <span className="user-name">
                        {ownerName} • {getServiceName(targetAppt)}
                      </span>
                      <span className="swap-time-badge">
                        {formatApptDate(targetAppt)} בשעה{" "}
                        {formatApptTime(targetAppt)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="request-swap-btn pending"
                    onClick={() => handleReject(req.id)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <Loader2 className="spinner" size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    בטל בקשה
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 4. תורים של אחרים זמינים להחלפה */}
      <div className="section-label">
        <RefreshCw size={18} />
        <span>תורים זמינים מהקהילה</span>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#64748b",
            margin: "16px 0",
          }}
        >
          <Loader2 className="spinner" size={20} />
          <span>טוען תורים זמינים...</span>
        </div>
      ) : availableSwaps.length > 0 ? (
        <div className="swaps-list">
          {availableSwaps.map((item) => {
            const appt = item.appointment || item;
            const isPending = pendingSwapId === item.id;
            const userName = getUserDisplayName(appt.user);

            return (
              <div key={item.id} className="swap-item-card">
                <div className="user-swap-info">
                  <div className="avatar-circle">{userName.charAt(0)}</div>
                  <div className="swap-text">
                    <span className="user-name">
                      {userName} • {getServiceName(appt)}
                    </span>
                    <span className="swap-time-badge">
                      {formatApptDate(appt)} בשעה {formatApptTime(appt)}
                    </span>
                  </div>
                </div>

                {isPending ? (
                  <button className="request-swap-btn pending" disabled>
                    <Clock size={14} />
                    מחכה לאישור...
                  </button>
                ) : (
                  <button
                    className="request-swap-btn"
                    onClick={() => onRequestSwap(item)}
                    disabled={!myAppointment || !myAppointment.isUpForSwap}
                    title={
                      !myAppointment?.isUpForSwap
                        ? "עליך להציע את התור שלך ראשית"
                        : ""
                    }
                  >
                    <RefreshCw size={14} />
                    החלף
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: "16px 0" }}>
          אין כרגע תורים מוצעים להחלפה מהקהילה.
        </p>
      )}
    </div>
  );
}
