import React, { useState } from "react";
import {
  ChevronRight,
  Scissors,
  User,
  Calendar,
  RefreshCw,
  ArrowDown,
} from "lucide-react";
import { extractTimeFromIso } from "../../utils/dateUtils";
import "./ConfirmScreen.css";

export default function ConfirmScreen({
  type = "booking", // 'booking' | 'swap' | 'custom'
  title = "אישור פרטים",
  buttonText,
  data = {},
  onConfirm,
  onBack,
}) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm({ ...data, notes });
  };

  // תמיכה גם בתורים אמיתיים מהשרת (dateTime) וגם בפורמט מקומי (date/time)
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

  const formatApptTime = (appt) =>
    appt?.dateTime ? extractTimeFromIso(appt.dateTime) : appt?.time || "";

  return (
    <div className="confirm-screen-container">
      {/* 1. כותרת וכפתור חזרה */}
      <div className="screen-header">
        <button onClick={onBack} className="back-btn" title="חזור">
          <ChevronRight size={22} />
        </button>
        <h2 className="screen-title">{title}</h2>
        <div className="header-placeholder"></div>
      </div>

      {/* 2. כרטיסיית תוכן דינמית לפי הסוג */}
      <div className="summary-card">
        {/* מקרה 1: אישור קביעת תור רגיל */}
        {type === "booking" && (
          <>
            <div className="summary-item">
              <div className="summary-item-left">
                <div className="summary-icon-wrapper">
                  <Scissors size={20} />
                </div>
                <div className="summary-details">
                  <span className="summary-label">שירות נבחר</span>
                  <span className="summary-value">{data.service?.name}</span>
                </div>
              </div>
              <span className="summary-price">{data.service?.price}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <div className="summary-item-left">
                <div className="summary-icon-wrapper">
                  <User size={20} />
                </div>
                <div className="summary-details">
                  <span className="summary-label">איש צוות / נותן שירות</span>
                  <span className="summary-value">{data.barber?.name}</span>
                </div>
              </div>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-item">
              <div className="summary-item-left">
                <div className="summary-icon-wrapper">
                  <Calendar size={20} />
                </div>
                <div className="summary-details">
                  <span className="summary-label">תאריך ושעה</span>
                  <span className="summary-value">
                    {data.date} בשעה {data.time}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* מקרה 2: אישור החלפת תור (Swap) 🔄 */}
        {type === "swap" && (
          <div className="swap-comparison">
            <div className="swap-box current">
              <span className="summary-label">התור הנוכחי שאתה מוסר:</span>
              <span className="summary-value">
                {formatApptDate(data.myAppt)} בשעה {formatApptTime(data.myAppt)}
              </span>
            </div>

            <div className="swap-arrow-divider">
              <RefreshCw size={22} />
            </div>

            <div className="swap-box target">
              <span className="summary-label">
                התור החדש שתקבל ({data.otherUserName}):
              </span>
              <span className="summary-value">
                {formatApptDate(data.targetAppt)} בשעה{" "}
                {formatApptTime(data.targetAppt)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. שדה הערות (מופיע במידה וצריך) */}
      <div className="notes-section">
        <label className="notes-label">הערות נוספות (אופציונלי):</label>
        <textarea
          placeholder="רשום הערה במידת הצורך..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="notes-textarea"
        />
      </div>

      {/* 4. כפתור אישור דינמי */}
      <button onClick={handleConfirm} className="confirm-btn">
        {buttonText || (type === "booking" ? "אשר קביעת תור" : "אשר החלפה")}
      </button>
    </div>
  );
}
