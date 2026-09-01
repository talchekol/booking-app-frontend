// src/utils/dateUtils.js

// מחזיר תמיד תאריך מקומי מדויק (YYYY-MM-DD) ללא תלות בשעת הלילה
export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// חילוץ שעה נקייה (HH:mm) ללא תלות באזור זמן או היסטים
export const extractTimeFromIso = (isoString) => {
  if (!isoString) return "--:--";
  const timePart = isoString.split("T")[1];
  if (!timePart) return "--:--";
  return timePart.slice(0, 5);
};

// מחשב טווח שעות (למשל: "12:00 - 14:00") לפי שעת התחלה ומשך בדקות
export const getTimeRangeDisplay = (isoString, durationMin = 30) => {
  const startTime = extractTimeFromIso(isoString);
  if (startTime === "--:--") return startTime;

  const [startH, startM] = startTime.split(":").map(Number);
  const totalEndMinutes = startH * 60 + startM + durationMin;

  const endH = String(Math.floor(totalEndMinutes / 60)).padStart(2, "0");
  const endM = String(totalEndMinutes % 60).padStart(2, "0");

  return `${startTime} - ${endH}:${endM}`;
};
