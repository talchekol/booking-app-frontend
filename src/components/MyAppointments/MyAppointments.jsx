import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Calendar,
} from "lucide-react";
import "./MyAppointments.css";

export default function MyAppointments({
  upcomingAppt,
  onCancelAppointment,
  onToggleSwapOffer,
  onStartBooking,
}) {
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'history'

  // נתוני דמו לתורים שהיו בעבר
  const pastAppointments = [
    {
      id: 1,
      service: "תספורת גברים",
      barber: "דניאל",
      date: "12/07/2026",
      time: "17:00",
      status: "הושלם",
    },
    {
      id: 2,
      service: "תספורת + זקן",
      barber: "יוסי",
      date: "18/06/2026",
      time: "15:30",
      status: "הושלם",
    },
  ];

  return (
    <div className="my-appts-container">
      {/* כותרת */}
      <div className="screen-header">
        <h2 className="screen-title">התורים שלי 📅</h2>
      </div>

      {/* סרגל לשוניות: תור עדכני / תורים קודמים */}
      <div className="appts-tabs-bar">
        <button
          className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          תור עדכני
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          תורים קודמים
        </button>
      </div>

      {/* לשונית 1: תור עדכני */}
      {activeTab === "upcoming" && (
        <div>
          {upcomingAppt ? (
            <div className="appointment-card">
              <div className="card-body">
                <img
                  src={upcomingAppt.imageUrl}
                  alt={upcomingAppt.barber}
                  className="barber-image"
                />
                <div className="appt-details">
                  <span className="service-name">{upcomingAppt.service}</span>
                  <span className="barber-name">עם {upcomingAppt.barber}</span>
                  <div className="time-badge">
                    <Clock size={14} />
                    <span>
                      {upcomingAppt.date} • {upcomingAppt.time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="action-btn cancel-btn"
                  onClick={onCancelAppointment}
                >
                  <XCircle size={15} />
                  <span>ביטול תור</span>
                </button>

                {upcomingAppt.isUpForSwap ? (
                  <button
                    className="action-btn cancel-swap-btn"
                    onClick={onToggleSwapOffer}
                  >
                    <XCircle size={15} />
                    <span>ביטול החלפה</span>
                  </button>
                ) : (
                  <button
                    className="action-btn swap-btn"
                    onClick={onToggleSwapOffer}
                  >
                    <RefreshCw size={15} />
                    <span>הצע להחלפה</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-appts-msg">
              <p>אין לך תור קרוב כרגע.</p>
              <button
                onClick={onStartBooking}
                className="cta-button"
                style={{ marginTop: "12px" }}
              >
                קבע תור חדש
              </button>
            </div>
          )}
        </div>
      )}

      {/* לשונית 2: תורים קודמים */}
      {activeTab === "history" && (
        <div className="history-list">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((item) => (
              <div key={item.id} className="history-card">
                <div className="history-info">
                  <span className="history-service">{item.service}</span>
                  <span className="history-barber">עם {item.barber}</span>
                  <div className="history-date">
                    <Calendar size={13} />
                    <span>
                      {item.date} • {item.time}
                    </span>
                  </div>
                </div>

                <div className="history-status-badge">
                  <CheckCircle2
                    size={12}
                    style={{ display: "inline", marginLeft: "4px" }}
                  />
                  {item.status}
                </div>
              </div>
            ))
          ) : (
            <p className="no-appts-msg">אין היסטוריית תורים מוצגת.</p>
          )}
        </div>
      )}
    </div>
  );
}
