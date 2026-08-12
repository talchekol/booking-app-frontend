import React from "react";
import { RefreshCw, Clock, XCircle, ArrowLeftRight, User } from "lucide-react";
import "./Swaps.css";

export default function Swaps({
  myAppointment,
  onToggleSwapOffer,
  onRequestSwap,
  pendingSwapId,
}) {
  // נתוני דמו של תורים שמשתמשים אחרים הציעו להחלפה
  const availableSwaps = [
    {
      id: 101,
      userName: "עידו לוי",
      service: "תספורת גברים",
      barber: "דניאל",
      date: "04/08/2026",
      time: "18:00",
    },
    {
      id: 102,
      userName: "אלון כהן",
      service: "תספורת + זקן",
      barber: "יוסי",
      date: "05/08/2026",
      time: "11:30",
    },
  ];

  //   const handleConfirmSwap = () => {
  //     if (selectedSwapItem) {
  //       setPendingSwapId(selectedSwapItem.id);
  //       setSelectedSwapItem(null);
  //     }
  //   };

  return (
    <div className="swaps-container">
      {/* הדר */}
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
                {myAppointment.service} (עם {myAppointment.barber})
              </span>
              <span className="offer-time">
                {myAppointment.date} בשעה {myAppointment.time}
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

      {/* 2. תורים של אחרים זמינים להחלפה */}
      <div className="section-label">
        <RefreshCw size={18} />
        <span>תורים זמינים מהקהילה</span>
      </div>

      <div className="swaps-list">
        {availableSwaps.map((item) => {
          const isPending = pendingSwapId === item.id;

          return (
            <div key={item.id} className="swap-item-card">
              <div className="user-swap-info">
                <div className="avatar-circle">{item.userName.charAt(0)}</div>
                <div className="swap-text">
                  <span className="user-name">
                    {item.userName} • {item.service}
                  </span>
                  <span className="swap-time-badge">
                    {item.date} בשעה {item.time}
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
    </div>
  );
}
