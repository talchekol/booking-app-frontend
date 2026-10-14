import React, { useState, useEffect, useRef } from "react";
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
import { extractTimeFromIso } from "../../utils/dateUtils";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";
import "./Swaps.css";

// --- פונקציות עזר ועיבוד נתונים מחוץ ל-JSX ---

const formatApptDate = (dateTimeStr) => {
  if (
    dateTimeStr &&
    typeof dateTimeStr === "string" &&
    dateTimeStr.includes("T")
  ) {
    const [datePart] = dateTimeStr.split("T");
    const [year, month, day] = datePart.split("-");
    return `${day}/${month}/${year}`;
  }
  return "";
};

const formatApptTime = (dateTimeStr) => {
  if (dateTimeStr) {
    return extractTimeFromIso(dateTimeStr);
  }
  return "";
};

const getUserDisplayName = (user) => {
  if (user?.firstName) {
    return `${user.firstName} ${user.lastName || ""}`.trim();
  }
  return "משתמש";
};

// עיבוד נתוני התור שלי
const formatMyOffer = (appt) => {
  if (!appt) return null;
  const service = appt.service?.name || "תספורת";
  const barber = appt.provider?.name || appt.barber?.name || "ספר";
  return {
    title: `${service} (עם ${barber})`,
    timeDisplay: `${formatApptDate(appt.dateTime)} בשעה ${formatApptTime(appt.dateTime)}`,
  };
};

// עיבוד בקשה נכנסת
const formatIncomingRequestItem = (req) => {
  const requesterName = getUserDisplayName(req.requester);
  const offered = req.offeredAppointment;
  const serviceName = offered?.service?.name || "תספורת";
  return {
    id: req.id,
    initial: requesterName.charAt(0),
    title: `${requesterName} מציע/ה • ${serviceName}`,
    timeDisplay: `${formatApptDate(offered?.dateTime)} בשעה ${formatApptTime(offered?.dateTime)}`,
  };
};

// עיבוד בקשה יוצאת
const formatOutgoingRequestItem = (req) => {
  const targetAppt = req.ownerAppointment;
  const ownerName = getUserDisplayName(req.owner);
  const serviceName = targetAppt?.service?.name || "תספורת";
  return {
    id: req.id,
    initial: ownerName.charAt(0),
    title: `${ownerName} • ${serviceName}`,
    timeDisplay: `${formatApptDate(targetAppt?.dateTime)} בשעה ${formatApptTime(targetAppt?.dateTime)}`,
  };
};

// עיבוד תור זמין בקהילה
const formatCommunitySwapItem = (item) => {
  const appt = item.appointment || item;
  const userName = getUserDisplayName(appt.user);
  const serviceName = appt.service?.name || "תספורת";
  return {
    id: item.id,
    initial: userName.charAt(0),
    title: `${userName} • ${serviceName}`,
    timeDisplay: `${formatApptDate(appt.dateTime)} בשעה ${formatApptTime(appt.dateTime)}`,
    raw: item,
  };
};

export default function Swaps({
  myAppointment,
  onToggleSwapOffer,
  onRequestSwap,
  pendingSwapId,
  onSwapChanged,
}) {
  const { businessId } = useTenant();
  const { showToast } = useToast();
  const [availableSwaps, setAvailableSwaps] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // שומר תמיד את הבקשות היוצאות האחרונות שנטענו - נקרא בתוך loadMarketSwaps
  // כדי לזהות "התפתרה אצל הצד השני" (ראו למטה). משתמשים ב-ref ולא בקריאה
  // ישירה ל-state כדי להימנע מבעיית closure מיושן כש-loadMarketSwaps נקרא
  // מתוך ה-polling interval למטה (אותה בעיה שתוקנה ב-ClientApp.jsx)
  const outgoingRequestsRef = useRef([]);
  useEffect(() => {
    outgoingRequestsRef.current = outgoingRequests;
  }, [outgoingRequests]);

  const loadMarketSwaps = async () => {
    setLoading(true);
    try {
      const [swaps, requests] = await Promise.all([
        fetchAvailableSwapsApi(businessId),
        getMySwapRequestsApi(),
      ]);
      setAvailableSwaps(Array.isArray(swaps) ? swaps : []);
      setIncomingRequests(
        Array.isArray(requests?.incoming) ? requests.incoming : [],
      );

      const newOutgoing = Array.isArray(requests?.outgoing)
        ? requests.outgoing
        : [];

      // זיהוי בקשה יוצאת שהייתה "ממתינה" בטעינה הקודמת וכבר אינה כזו עכשיו -
      // כלומר הצד השני אישר/דחה אותה ברקע. במקרה כזה צריך לרענן גם את התור
      // בפועל אצל שולח הבקשה (onSwapChanged), לא רק את רשימת ההחלפות
      const previouslyPendingIds = outgoingRequestsRef.current
        .filter((r) => r.status === "PENDING")
        .map((r) => r.id);
      const stillPendingIds = newOutgoing
        .filter((r) => r.status === "PENDING")
        .map((r) => r.id);
      const resolvedElsewhere = previouslyPendingIds.some(
        (id) => !stillPendingIds.includes(id),
      );

      setOutgoingRequests(newOutgoing);

      if (resolvedElsewhere && onSwapChanged) {
        onSwapChanged();
      }
    } catch (err) {
      console.error("שגיאה בטעינת נתוני שוק ההחלפות:", err);
      setAvailableSwaps([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketSwaps();
  }, [myAppointment?.isUpForSwap, pendingSwapId, businessId]);

  // Polling: כל עוד יש בקשת החלפה יוצאת שממתינה לאישור, בודקים כל 12 שניות
  // אם הצד השני כבר הגיב - כדי שמי ששלח את הבקשה יראה עדכון בלי לצאת
  // ולחזור לאפליקציה. רץ רק כשיש בקשה ממתינה בפועל, לא תמיד לכולם
  const hasPendingOutgoing = outgoingRequests.some(
    (r) => r.status === "PENDING",
  );
  useEffect(() => {
    if (!hasPendingOutgoing) return;
    const intervalId = setInterval(loadMarketSwaps, 12000);
    return () => clearInterval(intervalId);
  }, [hasPendingOutgoing, businessId]);

  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await approveSwapRequestApi(requestId);
      await loadMarketSwaps();
      if (onSwapChanged) onSwapChanged();
    } catch (err) {
      console.error("שגיאה באישור ההחלפה:", err);
      showToast(err.message || "אירעה שגיאה באישור ההחלפה, אנא נסה שוב", "error");
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
      showToast(err.message || "אירעה שגיאה, אנא נסה שוב", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const myOfferData = formatMyOffer(myAppointment);
  // מסך השוק מציג רק בקשות פעילות/ממתינות - היסטוריית בקשות שטופלו
  // (אושרו/נדחו/בוטלו) מוצגת בטאב "הודעות", לא כאן
  const incomingList = incomingRequests
    .filter((req) => req.status === "PENDING")
    .map(formatIncomingRequestItem);
  const outgoingList = outgoingRequests
    .filter((req) => req.status === "PENDING")
    .map(formatOutgoingRequestItem);
  const communityList = availableSwaps.map(formatCommunitySwapItem);

  return (
    <div className="swaps-container">
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
              <span className="offer-title">{myOfferData?.title}</span>
              <span className="offer-time">{myOfferData?.timeDisplay}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-notice-text">
          {myAppointment
            ? 'התור שלך עדיין לא מוצע להחלפה. לחץ "הצע להחלפה" בדף הבית כדי להציע אותו.'
            : "אין לך תור פעיל להציע להחלפה."}
        </p>
      )}

      {/* 2. בקשות החלפה שקיבלתי מאחרים */}
      {incomingList.length > 0 && (
        <>
          <div className="section-label">
            <Clock size={18} />
            <span>בקשות החלפה שקיבלת</span>
          </div>
          <div className="swaps-list">
            {incomingList.map((req) => {
              const isBusy = actionLoadingId === req.id;
              return (
                <div key={req.id} className="swap-item-card">
                  <div className="user-swap-info">
                    <div className="avatar-circle">{req.initial}</div>
                    <div className="swap-text">
                      <span className="user-name">{req.title}</span>
                      <span className="swap-time-badge">{req.timeDisplay}</span>
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

      {/* 3. בקשות החלפה שאני שלחתי */}
      {outgoingList.length > 0 && (
        <>
          <div className="section-label">
            <RefreshCw size={18} />
            <span>הבקשות שלך הממתינות לאישור</span>
          </div>
          <div className="swaps-list">
            {outgoingList.map((req) => {
              const isBusy = actionLoadingId === req.id;
              return (
                <div key={req.id} className="swap-item-card">
                  <div className="user-swap-info">
                    <div className="avatar-circle">{req.initial}</div>
                    <div className="swap-text">
                      <span className="user-name">{req.title}</span>
                      <span className="swap-time-badge">{req.timeDisplay}</span>
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
        <div className="loading-state-row">
          <Loader2 className="spinner" size={20} />
          <span>טוען תורים זמינים...</span>
        </div>
      ) : communityList.length > 0 ? (
        <div className="swaps-list">
          {communityList.map((item) => {
            const isPending = pendingSwapId === item.id;
            return (
              <div key={item.id} className="swap-item-card">
                <div className="user-swap-info">
                  <div className="avatar-circle">{item.initial}</div>
                  <div className="swap-text">
                    <span className="user-name">{item.title}</span>
                    <span className="swap-time-badge">{item.timeDisplay}</span>
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
                    onClick={() => onRequestSwap(item.raw)}
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
        <p className="empty-notice-text">
          אין כרגע תורים מוצעים להחלפה מהקהילה.
        </p>
      )}
    </div>
  );
}
