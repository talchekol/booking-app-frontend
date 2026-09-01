import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Calendar,
} from "lucide-react";
import { extractTimeFromIso } from "../../utils/dateUtils";
import "./MyAppointments.css";

const getServiceName = (appt) =>
  appt?.service?.name ||
  (typeof appt?.service === "string" ? appt.service : "תספורת");

const getBarberName = (appt) =>
  appt?.provider?.name ||
  appt?.barber?.name ||
  (typeof appt?.barber === "string" ? appt.barber : "ספר");

const getImageUrl = (appt) =>
  appt?.provider?.imageUrl ||
  appt?.barber?.imageUrl ||
  appt?.imageUrl ||
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

const formatApptDate = (appt) => {
  if (
    appt?.dateTime &&
    typeof appt.dateTime === "string" &&
    appt.dateTime.includes("T")
  ) {
    const [datePart] = appt.dateTime.split("T");
    const [year, month, day] = datePart.split("-");
    return `${day}/${month}/${year}`;
  }
  return appt?.date || "";
};

const formatApptTime = (appt) => {
  if (appt?.dateTime) {
    return extractTimeFromIso(appt.dateTime);
  }
  return appt?.time || "";
};

export default function MyAppointments({
  upcomingAppt,
  historyAppts = [],
  onCancelAppointment,
  onToggleSwapOffer,
  onStartBooking,
}) {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <div className="my-appts-container">
      {/* כותרת */}
      <div className="screen-header">
        <h2 className="screen-title">התורים שלי 📅</h2>
      </div>

      {/* סרגל לשוניות */}
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
                  src={getImageUrl(upcomingAppt)}
                  alt={getBarberName(upcomingAppt)}
                  className="barber-image"
                />
                <div className="appt-details">
                  <span className="service-name">
                    {getServiceName(upcomingAppt)}
                  </span>
                  <span className="barber-name">
                    עם {getBarberName(upcomingAppt)}
                  </span>
                  <div className="time-badge">
                    <Clock size={14} />
                    <span>
                      {formatApptDate(upcomingAppt)} •{" "}
                      {formatApptTime(upcomingAppt)}
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
          {historyAppts && historyAppts.length > 0 ? (
            historyAppts.map((item) => (
              <div key={item.id} className="history-card">
                <div className="history-info">
                  <span className="history-service">
                    {getServiceName(item)}
                  </span>
                  <span className="history-barber">
                    עם {getBarberName(item)}
                  </span>
                  <div className="history-date">
                    <Calendar size={13} />
                    <span>
                      {formatApptDate(item)} • {formatApptTime(item)}
                    </span>
                  </div>
                </div>

                <div className="history-status-badge">
                  <CheckCircle2
                    size={12}
                    style={{ display: "inline", marginLeft: "4px" }}
                  />
                  {item.status === "CONFIRMED"
                    ? "מאושר"
                    : item.status || "הושלם"}
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
