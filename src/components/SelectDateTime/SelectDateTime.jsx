import React, { useState, useEffect } from "react";
import { ChevronRight, Clock, AlertCircle } from "lucide-react";
import {
  getBusinessAppointmentsApi,
  getBlockedDaysApi,
  getBusinessSettingsApi,
} from "../../services/api";
import { getLocalDateString, extractTimeFromIso } from "../../utils/dateUtils";
import { useTenant } from "../../context/TenantContext";
import "./SelectDateTime.css";

// יצירת שעות דינמיות לפי הגדרות בעל העסק
const generateTimeSlots = (
  openTime = "09:00",
  closeTime = "19:30",
  interval = 30,
) => {
  const slots = [];
  const [startH, startM] = openTime.split(":").map(Number);
  const [endH, endM] = closeTime.split(":").map(Number);
  const intervalNum = Number(interval) || 30; // 👈 הבטחה שמדובר במספר

  let currentMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  while (currentMin <= endMin) {
    const h = String(Math.floor(currentMin / 60)).padStart(2, "0");
    const m = String(currentMin % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    currentMin += intervalNum;
  }
  return slots;
};

const HEBREW_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function SelectDateTime({
  selectedBarber,
  onSelectDateTime,
  onBack,
}) {
  const { slug } = useTenant();
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [dayBlockedReason, setDayBlockedReason] = useState(null);
  const [loading, setLoading] = useState(false);

  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getLocalDateString(d);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateNum = String(d.getDate()).padStart(2, "0");

    return {
      id: String(i + 1),
      dateStr: dateStr,
      dayName: HEBREW_DAYS[d.getDay()],
      dateNum: dateNum,
      displayDate: `${dateNum}/${month}`,
    };
  });

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setDayBlockedReason(null);
      setSelectedTime("");

      try {
        const providerId = selectedBarber?.id;

        const [settings, appointments, blockedDays] = await Promise.all([
          getBusinessSettingsApi(slug).catch(() => ({
            openTime: "09:00",
            closeTime: "19:30",
            slotInterval: 30,
            bookingOpenUntil: null,
          })),
          getBusinessAppointmentsApi(slug, selectedDate, providerId).catch(
            () => [],
          ),
          getBlockedDaysApi(slug, selectedDate).catch(() => []),
        ]);

        // 1. בדיקת חסימת שבוע שלא פורסם
        if (
          settings?.bookingOpenUntil &&
          selectedDate > settings.bookingOpenUntil
        ) {
          setDayBlockedReason("היומן לתאריך זה טרם נפתח להזמנות ע״י בעל העסק");
          setAvailableSlots([]);
          return;
        }

        // 2. בדיקת חסימת יום מלא
        const isDayBlocked = (blockedDays || []).find((b) => {
          if (!b.providerId) return true;
          return b.providerId === providerId;
        });

        if (isDayBlocked) {
          setDayBlockedReason(isDayBlocked.reason || "אין קבלת קהל ביום זה");
          setAvailableSlots([]);
          return;
        }

        // 3. ייצור כל המשבצות האפשריות
        const intervalToUse = Number(settings?.slotInterval) || 30;

        const allPossibleSlots = generateTimeSlots(
          settings?.openTime || "09:00",
          settings?.closeTime || "19:30",
          intervalToUse,
        );

        // 4. פונקציית בדיקה: האם משבצת שעה נופלת בתוך תור או חסימת שעות (לפי משך השירות)
        const isSlotTaken = (slotTimeStr) => {
          const [slotH, slotM] = slotTimeStr.split(":").map(Number);
          const slotMinutes = slotH * 60 + slotM;

          return (appointments || []).some((apt) => {
            if (apt.status === "CANCELLED") return false;

            // חסימה שרלוונטית אם היא מוגדרת לכל הספרים (null) או לספר הנבחר בלבד
            if (apt.providerId && providerId && apt.providerId !== providerId) {
              return false;
            }

            const aptTimeStr = extractTimeFromIso(apt.dateTime);
            if (!aptTimeStr || aptTimeStr === "--:--") return false;

            const [aptH, aptM] = aptTimeStr.split(":").map(Number);
            const aptStartMinutes = aptH * 60 + aptM;
            const duration = apt.service?.durationMin || 30;
            const aptEndMinutes = aptStartMinutes + duration;

            return (
              slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes
            );
          });
        };

        // 5. סינון שעות פנויות בלבד
        const freeSlots = allPossibleSlots.filter((slot) => !isSlotTaken(slot));
        setAvailableSlots(freeSlots);
      } catch (err) {
        console.error("שגיאה בחישוב זמינות תורים:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, selectedBarber, slug]);

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      const currentDay = upcomingDays.find((d) => d.dateStr === selectedDate);
      onSelectDateTime({
        date: selectedDate,
        time: selectedTime,
        dayName: currentDay ? currentDay.dayName : "",
      });
    }
  };

  return (
    <div className="select-datetime-container">
      <div className="screen-header">
        <button onClick={onBack} className="back-btn" title="חזור">
          <ChevronRight size={22} />
        </button>
        <h2 className="screen-title">בחר תאריך ושעה</h2>
        <div className="header-placeholder"></div>
      </div>

      <h3 className="section-subtitle">תאריכים פנויים</h3>
      <div className="date-picker-scroll">
        {upcomingDays.map((dateObj) => (
          <div
            key={dateObj.id}
            className={`date-card ${
              selectedDate === dateObj.dateStr ? "selected" : ""
            }`}
            onClick={() => setSelectedDate(dateObj.dateStr)}
          >
            <span className="date-day-name">יום {dateObj.dayName}</span>
            <span className="date-number">{dateObj.dateNum}</span>
          </div>
        ))}
      </div>

      <h3 className="section-subtitle">שעות זמינות</h3>
      {loading ? (
        <div className="empty-state">בודק שעות זמינות...</div>
      ) : dayBlockedReason ? (
        <div
          className="blocked-day-card"
          style={{ textAlign: "center", padding: "20px" }}
        >
          <AlertCircle
            size={36}
            color="#ef4444"
            style={{ margin: "0 auto 8px" }}
          />
          <h4 style={{ margin: "0 0 4px", color: "#ef4444" }}>
            אין אפשרות לקבוע תור
          </h4>
          <p style={{ margin: 0, color: "#64748b" }}>{dayBlockedReason}</p>
        </div>
      ) : availableSlots.length > 0 ? (
        <div className="time-slots-grid">
          {availableSlots.map((time) => (
            <button
              key={time}
              type="button"
              className={`time-slot-btn ${
                selectedTime === time ? "selected" : ""
              }`}
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">אין תורים פנויים במועד זה.</div>
      )}

      <button
        onClick={handleNext}
        disabled={
          !selectedDate || !selectedTime || loading || !!dayBlockedReason
        }
        className="submit-btn"
        style={{ marginTop: "24px" }}
      >
        המשך לאישור פרטים
      </button>
    </div>
  );
}
