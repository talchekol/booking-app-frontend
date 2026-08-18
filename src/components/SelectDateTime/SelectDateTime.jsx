import React, { useState, useMemo } from "react";
import { ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import "./SelectDateTime.css";

export default function SelectDateTime({ onSelectDateTime, onBack }) {
  // 1. חישוב דינמי של 7 הימים הקרובים החל מהיום
  const availableDates = useMemo(() => {
    const days = [];
    const dayLetters = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dateNum = String(d.getDate()).padStart(2, "0");

      days.push({
        id: String(i + 1),
        dayName: dayLetters[d.getDay()],
        dateNum: dateNum,
        // פורמט ISO תקין (YYYY-MM-DD) שנשלח לשרת
        fullDate: `${year}-${month}-${dateNum}`,
        // לתצוגה יפה
        displayDate: `${dateNum}/${month}`,
      });
    }
    return days;
  }, []);

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
