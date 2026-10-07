import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  CalendarX,
  Lock,
  Unlock,
  Plus,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import {
  getWeekPublishStatusApi,
  publishWeekApi,
  unpublishWeekApi,
  getMyBlockedDaysApi,
  blockFullDayApi,
  unblockFullDayApi,
  getMyAppointmentsAdminApi,
  blockTimeRangeApi,
  unblockAppointmentApi,
} from "../../../services/api";
import { getLocalDateString, getTimeRangeDisplay } from "../../../utils/dateUtils";
import { useToast } from "../../../context/ToastContext";
import "./WeeklyPublishTab.css";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// בונה מחרוזות תאריך (YYYY-MM-DD) לכל 7 ימי השבוע החל מ-weekStart, ב-UTC בלבד
// (בדיוק כמו בשרת) כדי שלא תהיה הזזה של יום לפי אזור הזמן של הדפדפן
const buildWeekDates = (weekStart) => {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

// מזיז מחרוזת תאריך (YYYY-MM-DD) קדימה/אחורה במספר ימים נתון, ב-UTC בלבד
const shiftDate = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const formatDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
};

const getDayIndex = (dateStr) =>
  new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();

export default function WeeklyPublishTab({ providers = [] }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(null);
  // השבוע שמוצג כרגע (YYYY-MM-DD של יום ראשון שלו) - נפרד מ-status.nextWeekStart
  // כדי שאפשר יהיה לנווט אחורה/קדימה בלי לגעת בפרסום בפועל
  const [viewedWeekStart, setViewedWeekStart] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [hourFormOpenFor, setHourFormOpenFor] = useState(null);
  const [hourForm, setHourForm] = useState({
    startTime: "12:00",
    endTime: "14:00",
    providerId: "",
    reason: "",
  });

  const loadStatus = async () => {
    const today = getLocalDateString();
    const statusData = await getWeekPublishStatusApi(today);
    setStatus(statusData);
    return statusData;
  };

  const loadDaysFor = async (weekStart) => {
    setLoading(true);
    try {
      const dates = buildWeekDates(weekStart);
      const results = await Promise.all(
        dates.map(async (dateStr) => {
          const [blockedDays, appointments] = await Promise.all([
            getMyBlockedDaysApi(dateStr).catch(() => []),
            getMyAppointmentsAdminApi(dateStr).catch(() => []),
          ]);
          const hourBlocks = (appointments || []).filter((a) =>
            a.service?.name?.startsWith("חסום"),
          );
          return { dateStr, blockedDays: blockedDays || [], hourBlocks };
        }),
      );
      setDays(results);
    } catch (err) {
      console.error("שגיאה בטעינת השבוע:", err);
    } finally {
      setLoading(false);
    }
  };

  // טעינה ראשונית - מתחילים בהצגת השבוע הבא לפרסום
  useEffect(() => {
    (async () => {
      const statusData = await loadStatus();
      setViewedWeekStart(statusData.nextWeekStart);
    })();
  }, []);

  // כל פעם שהשבוע המוצג משתנה (ניווט או איפוס אחרי פרסום/ביטול) - טוענים את הימים שלו
  useEffect(() => {
    if (viewedWeekStart) loadDaysFor(viewedWeekStart);
  }, [viewedWeekStart]);

  const viewedWeekEnd = viewedWeekStart ? shiftDate(viewedWeekStart, 6) : null;
  const isPublishTarget = status && viewedWeekStart === status.nextWeekStart;
  const isAlreadyPublished =
    status?.bookingOpenUntil &&
    viewedWeekEnd &&
    viewedWeekEnd <= status.bookingOpenUntil;
  const isLatestPublished =
    status?.bookingOpenUntil && viewedWeekEnd === status.bookingOpenUntil;

  const handleToggleDayBlock = async (day) => {
    try {
      if (day.blockedDays.length > 0) {
        await Promise.all(
          day.blockedDays.map((b) => unblockFullDayApi(b.id)),
        );
      } else {
        await blockFullDayApi({ date: day.dateStr, reason: "לא זמין השבוע" });
      }
      loadDaysFor(viewedWeekStart);
    } catch (err) {
      showToast(err.message || "שגיאה בעדכון חסימת היום", "error");
    }
  };

  const handleSaveHourBlock = async (dateStr) => {
    try {
      await blockTimeRangeApi({
        date: dateStr,
        startTime: hourForm.startTime,
        endTime: hourForm.endTime,
        providerId: hourForm.providerId || undefined,
        reason: hourForm.reason || "חסום",
      });
      setHourFormOpenFor(null);
      setHourForm({ startTime: "12:00", endTime: "14:00", providerId: "", reason: "" });
      loadDaysFor(viewedWeekStart);
    } catch (err) {
      showToast(err.message || "שגיאה בחסימת השעות", "error");
    }
  };

  const handleRemoveHourBlock = async (apt) => {
    try {
      await unblockAppointmentApi(apt.id);
      loadDaysFor(viewedWeekStart);
    } catch (err) {
      showToast("שגיאה בשחרור החסימה", "error");
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const today = getLocalDateString();
      const res = await publishWeekApi(today);
      showToast(`התורים פורסמו בהצלחה עד ${formatDisplayDate(res.weekEnd)}!`, "success");
      const statusData = await loadStatus();
      setViewedWeekStart(statusData.nextWeekStart);
    } catch (err) {
      showToast(err.message || "שגיאה בפרסום השבוע", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setUnpublishing(true);
    try {
      const today = getLocalDateString();
      await unpublishWeekApi(today);
      showToast("פרסום השבוע בוטל - השבוע חזר להיות לא מפורסם", "success");
      const statusData = await loadStatus();
      setViewedWeekStart(statusData.nextWeekStart);
    } catch (err) {
      showToast(err.message || "שגיאה בביטול הפרסום", "error");
    } finally {
      setUnpublishing(false);
    }
  };

  const goToPrevWeek = () => setViewedWeekStart((w) => shiftDate(w, -7));
  const goToNextWeek = () => setViewedWeekStart((w) => shiftDate(w, 7));
  const goToPublishTarget = () => status && setViewedWeekStart(status.nextWeekStart);

  if (loading || !status) {
    return (
      <div className="tab-pane">
        <div className="loading-state-row">
          <Loader2 className="spinner" size={20} />
          <span>טוען את השבוע הקרוב...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane">
      <h2 className="pane-title">פרסום תורים שבועי</h2>

      <div className="card-box week-status-card">
        <div className="week-nav-row">
          <button onClick={goToPrevWeek} className="btn-ghost week-nav-btn" title="שבוע קודם">
            <ChevronRight size={18} />
          </button>
          <div className="week-nav-title">
            {formatDisplayDate(viewedWeekStart)} - {formatDisplayDate(viewedWeekEnd)}
          </div>
          <button onClick={goToNextWeek} className="btn-ghost week-nav-btn" title="שבוע הבא">
            <ChevronLeft size={18} />
          </button>
          {!isPublishTarget && (
            <button onClick={goToPublishTarget} className="btn-ghost week-nav-reset" title="חזרה לשבוע הבא לפרסום">
              <RotateCcw size={14} />
              <span>השבוע הבא לפרסום</span>
            </button>
          )}
        </div>

        <div className="week-status-body">
          <div>
            <p className="week-status-sub">
              {isPublishTarget
                ? "זהו השבוע הבא שממתין לפרסום - הלקוחות עדיין לא רואים אותו"
                : isAlreadyPublished
                  ? "שבוע זה כבר פורסם ונראה ללקוחות"
                  : "אי אפשר לפרסם שבוע זה עדיין - קודם יש לפרסם את השבועות שלפניו"}
            </p>
            <p className="week-status-sub">
              {status.bookingOpenUntil
                ? `בסה״כ התורים פתוחים ללקוחות עד ${formatDisplayDate(status.bookingOpenUntil)}`
                : "עדיין לא פורסם אף שבוע - הלקוחות לא יראו תורים פנויים"}
            </p>
          </div>

          {isPublishTarget && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn-primary publish-week-btn"
            >
              <CalendarCheck size={17} />
              {publishing ? "מפרסם..." : "פרסם תורים לשבוע זה"}
            </button>
          )}

          {isLatestPublished && (
            <button
              onClick={handleUnpublish}
              disabled={unpublishing}
              className="btn-danger publish-week-btn"
            >
              <CalendarX size={17} />
              {unpublishing ? "מבטל..." : "בטל פרסום שבוע זה"}
            </button>
          )}
        </div>
      </div>

      <div className="week-days-grid">
        {days.map((day) => {
          const dayIdx = getDayIndex(day.dateStr);
          const isBlocked = day.blockedDays.length > 0;
          return (
            <div
              key={day.dateStr}
              className={`week-day-card ${isBlocked ? "blocked" : ""}`}
            >
              <div className="week-day-card__header">
                <span className="week-day-name">יום {HEBREW_DAYS[dayIdx]}</span>
                <span className="week-day-date">{formatDisplayDate(day.dateStr)}</span>
              </div>

              <button
                onClick={() => handleToggleDayBlock(day)}
                className={`week-day-toggle ${isBlocked ? "is-blocked" : "is-open"}`}
              >
                {isBlocked ? <Lock size={14} /> : <Unlock size={14} />}
                {isBlocked ? "יום חסום" : "יום פתוח"}
              </button>

              {!isBlocked && (
                <div className="week-day-hours">
                  {day.hourBlocks.map((apt) => (
                    <div key={apt.id} className="week-hour-chip">
                      <span>
                        {getTimeRangeDisplay(apt.dateTime, apt.service?.durationMin)}
                        {apt.provider?.name ? ` · ${apt.provider.name}` : ""}
                      </span>
                      <button
                        onClick={() => handleRemoveHourBlock(apt)}
                        title="הסר חסימה"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {hourFormOpenFor === day.dateStr ? (
                    <div className="week-hour-form">
                      <input
                        type="time"
                        value={hourForm.startTime}
                        onChange={(e) =>
                          setHourForm({ ...hourForm, startTime: e.target.value })
                        }
                      />
                      <input
                        type="time"
                        value={hourForm.endTime}
                        onChange={(e) =>
                          setHourForm({ ...hourForm, endTime: e.target.value })
                        }
                      />
                      <select
                        value={hourForm.providerId}
                        onChange={(e) =>
                          setHourForm({ ...hourForm, providerId: e.target.value })
                        }
                      >
                        <option value="">כל הספרים</option>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="סיבה"
                        value={hourForm.reason}
                        onChange={(e) =>
                          setHourForm({ ...hourForm, reason: e.target.value })
                        }
                      />
                      <div className="week-hour-form__actions">
                        <button
                          onClick={() => handleSaveHourBlock(day.dateStr)}
                          className="btn-primary"
                        >
                          שמור
                        </button>
                        <button
                          onClick={() => setHourFormOpenFor(null)}
                          className="btn-ghost"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setHourFormOpenFor(day.dateStr)}
                      className="week-add-hour-btn"
                    >
                      <Plus size={13} />
                      חסימת שעות
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
