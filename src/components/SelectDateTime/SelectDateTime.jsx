import React, { useState } from "react";
import { ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import "./SelectDateTime.css";

export default function SelectDateTime({ onSelectDateTime, onBack }) {
  // תאריכים לדוגמה (שבוע קרוב)
  const availableDates = [
    { id: "1", dayName: "א׳", dateNum: "02", fullDate: "02/08/2026" },
    { id: "2", dayName: "ב׳", dateNum: "03", fullDate: "03/08/2026" },
    { id: "3", dayName: "ג׳", dateNum: "04", fullDate: "04/08/2026" },
    { id: "4", dayName: "ד׳", dateNum: "05", fullDate: "05/08/2026" },
    { id: "5", dayName: "ה׳", dateNum: "06", fullDate: "06/08/2026" },
    { id: "6", dayName: "ו׳", dateNum: "07", fullDate: "07/08/2026" },
    { id: "7", dayName: "ש׳", dateNum: "08", fullDate: "08/08/2026" },
  ];

  // שעות פנויות לדוגמה (בהמשך יחושבו דינמית ב-Backend לפי שעות פעילות ותורים קיימים)
  const availableTimes = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ];

  // State לתאריך ושעה שנבחרו
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [selectedTime, setSelectedTime] = useState("");

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onSelectDateTime({
        date: selectedDate.fullDate,
        time: selectedTime,
        dayName: selectedDate.dayName,
      });
    }
  };

  return (
    <div className="select-datetime-container">
      {/* 1. כותרת וכפתור חזרה */}
      <div className="screen-header">
        <button onClick={onBack} className="back-btn" title="חזור">
          <ChevronRight size={22} />
        </button>
        <h2 className="screen-title">בחר תאריך ושעה</h2>
        <div className="header-placeholder"></div>
      </div>

      {/* 2. סקשיין בחירת תאריך */}
      <h3 className="section-subtitle">תאריכים פנויים</h3>
      <div className="date-picker-scroll">
        {availableDates.map((dateObj) => (
          <div
            key={dateObj.id}
            className={`date-card ${selectedDate?.id === dateObj.id ? "selected" : ""}`}
            onClick={() => setSelectedDate(dateObj)}
          >
            <span className="date-day-name">יום {dateObj.dayName}</span>
            <span className="date-number">{dateObj.dateNum}</span>
          </div>
        ))}
      </div>

      {/* 3. סקשיין בחירת שעה */}
      <h3 className="section-subtitle">שעות זמינות</h3>
      <div className="time-slots-grid">
        {availableTimes.map((time) => (
          <button
            key={time}
            className={`time-slot-btn ${selectedTime === time ? "selected" : ""}`}
            onClick={() => setSelectedTime(time)}
          >
            {time}
          </button>
        ))}
      </div>

      {/* 4. כפתור המשך לסיכום */}
      <button
        onClick={handleNext}
        disabled={!selectedDate || !selectedTime}
        className="submit-btn"
      >
        המשך לאישור פרטים
      </button>
    </div>
  );
}
