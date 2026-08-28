import React, { useState, useEffect } from "react";
import "./CalendarTab.css";
import {
  getBusinessAppointmentsApi,
  updateAppointmentStatusApi,
  createManualAppointmentApi,
  blockTimeRangeApi,
  getBlockedDaysApi,
  blockFullDayApi,
  unblockFullDayApi,
  unblockAppointmentApi,
} from "../../../services/api";

const STATUS_CYCLE = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const STATUS_LABELS = {
  CONFIRMED: "מאושר",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
  NO_SHOW: "לא הגיע",
};

export default function CalendarTab({ services = [], providers = [] }) {
  const [appointments, setAppointments] = useState([]);
  const [blockedDays, setBlockedDays] = useState([]);
  const [dateOffset, setDateOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // מודלים וטפסים
  const [activeModal, setActiveModal] = useState(null); // 'walkin' | 'block-hour' | 'block-day' | null
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }

  // State תור ידני
  const [walkIn, setWalkIn] = useState({
    name: "",
    phone: "",
    time: "",
    serviceId: "",
    providerId: "",
  });

  // State חסימת שעות
  const [blockHour, setBlockHour] = useState({
    startTime: "12:00",
    endTime: "14:00",
    providerId: "",
    reason: "הפסקת צהריים",
  });

  // State חסימת יום
  const [blockDay, setBlockDay] = useState({
    providerId: "",
    reason: "יום חופש",
  });

  const getTargetDate = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };

  const getDateString = (offset) => {
    return getTargetDate(offset).toISOString().split("T")[0];
  };

  const getFormattedHebrewDate = (offset) => {
    const d = getTargetDate(offset);
    return d.toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const dateStr = getDateString(dateOffset);
      const [aptsData, blocksData] = await Promise.all([
        getBusinessAppointmentsApi(dateStr),
        getBlockedDaysApi(dateStr).catch(() => []),
      ]);
      setAppointments(aptsData || []);
      setBlockedDays(blocksData || []);
    } catch (err) {
      console.error("שגיאה בטעינת נתונים:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateOffset]);

  // שינוי סטטוס תור רגיל
  const handleCycleStatus = async (apt) => {
    if (apt.service?.name?.startsWith("חסום")) return;
    const nextStatusIndex =
      (STATUS_CYCLE.indexOf(apt.status) + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextStatusIndex];
    try {
      await updateAppointmentStatusApi(apt.id, nextStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, status: nextStatus } : a)),
      );
    } catch (err) {
      alert("שגיאה בעדכון סטטוס התור");
    }
  };

  // ביטול חסימת שעה בודדת
  const handleUnblockHour = (apt) => {
    setConfirmModal({
      message: "האם לבטל את החסימה ולפתוח את השעה הזו לתורים?",
      onConfirm: async () => {
        try {
          await unblockAppointmentApi(apt.id);
          setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
        } catch (e) {
          alert("שגיאה בשחרור החסימה");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  // ביטול חסימת יום מלא
  const handleUnblockDay = (blockRecord) => {
    setConfirmModal({
      message: "האם לבטל את חסימת היום ולפתוח את היום לקבלת קהל?",
      onConfirm: async () => {
        try {
          await unblockFullDayApi(blockRecord.id);
          setBlockedDays((prev) => prev.filter((b) => b.id !== blockRecord.id));
        } catch (e) {
          alert("שגיאה בביטול חסימת היום");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  // שמירת תור ידני
  const handleSaveWalkIn = async () => {
    if (
      !walkIn.name ||
      !walkIn.time ||
      !walkIn.serviceId ||
      !walkIn.providerId
    ) {
      alert("נא למלא את כל השדות לקביעת תור ידני");
      return;
    }
    const dateStr = getDateString(dateOffset);
    const dateTime = `${dateStr}T${walkIn.time}:00.000Z`;
    try {
      await createManualAppointmentApi({
        clientName: walkIn.name,
        clientPhone: walkIn.phone || undefined,
        dateTime,
        serviceId: walkIn.serviceId,
        providerId: walkIn.providerId,
      });
      setActiveModal(null);
      setWalkIn({
        name: "",
        phone: "",
        time: "",
        serviceId: "",
        providerId: "",
      });
      loadData();
    } catch (err) {
      alert(err.message || "שגיאה בקביעת תור");
    }
  };

  // שמירת חסימת שעות
  const handleSaveBlockHour = async () => {
    const dateStr = getDateString(dateOffset);
    try {
      await blockTimeRangeApi({
        date: dateStr,
        startTime: blockHour.startTime,
        endTime: blockHour.endTime,
        providerId: blockHour.providerId || undefined,
        reason: blockHour.reason,
      });
      //
      setActiveModal(null);
      loadData();
    } catch (err) {
      alert(err.message || "שגיאה בחסימת השעות");
    }
  };

  // שמירת חסימת יום
  const handleSaveBlockDay = async () => {
    const dateStr = getDateString(dateOffset);
    try {
      await blockFullDayApi({
        date: dateStr,
        providerId: blockDay.providerId || undefined,
        reason: blockDay.reason,
      });
      setActiveModal(null);
      loadData();
    } catch (err) {
      alert(err.message || "שגיאה בחסימת היום");
    }
  };

  return (
    <div className="tab-pane">
      {/* סרגל עליון */}
      <div className="pane-header">
        <div className="date-header-wrapper">
          <h2 className="pane-title">{getFormattedHebrewDate(dateOffset)}</h2>
          <span className="pane-subtitle">
            {dateOffset === 0
              ? "תצוגת היום"
              : dateOffset === 1
                ? "מחר"
                : dateOffset === -1
                  ? "אתמול"
                  : `תצוגת ${getDateString(dateOffset)}`}
          </span>
        </div>

        <div className="action-buttons-group">
          <button
            onClick={() =>
              setActiveModal(activeModal === "walkin" ? null : "walkin")
            }
            className="btn-primary"
          >
            + תור ידני
          </button>
          <button
            onClick={() =>
              setActiveModal(activeModal === "block-hour" ? null : "block-hour")
            }
            className="btn-secondary"
          >
            חסימת שעה
          </button>
          <button
            onClick={() =>
              setActiveModal(activeModal === "block-day" ? null : "block-day")
            }
            className="btn-secondary"
          >
            חסימת יום
          </button>

          <button
            onClick={() => setDateOffset((p) => p - 1)}
            className="btn-nav"
          >
            ‹
          </button>
          <button
            onClick={() => setDateOffset(0)}
            className={`btn-today ${dateOffset === 0 ? "active" : ""}`}
          >
            {dateOffset === 0 ? "היום" : "חזור להיום"}
          </button>
          <button
            onClick={() => setDateOffset((p) => p + 1)}
            className="btn-nav"
          >
            ›
          </button>
        </div>
      </div>

      {/* באנר כוכבית לחסימת יום */}
      {blockedDays.length > 0 && (
        <div className="day-notice-list">
          {blockedDays.map((block) => (
            <div key={block.id} className="day-notice-banner">
              <div className="day-notice-text">
                <span className="star-icon">*</span>
                <strong>
                  {block.provider?.name
                    ? `${block.provider.name} לא עובד/ת היום`
                    : "העסק סגור היום"}
                </strong>
                {block.reason && (
                  <span className="reason-text">({block.reason})</span>
                )}
              </div>
              <button
                onClick={() => handleUnblockDay(block)}
                className="btn-unblock-pill"
                title="ביטול חופש ופתיחת היום לתורים"
              >
                בטל חסימה ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 1. טופס תור ידני */}
      {activeModal === "walkin" && (
        <div className="form-card">
          <div className="form-card-title">תור ידני (Walk-in / טלפוני)</div>
          <div className="form-grid">
            <input
              placeholder="שם לקוח"
              value={walkIn.name}
              onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })}
              className="admin-input"
            />
            <input
              placeholder="טלפון (אופציונלי)"
              value={walkIn.phone}
              onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
              className="admin-input"
            />
            <input
              type="time"
              value={walkIn.time}
              onChange={(e) => setWalkIn({ ...walkIn, time: e.target.value })}
              className="admin-input"
            />
            <select
              value={walkIn.serviceId}
              onChange={(e) =>
                setWalkIn({ ...walkIn, serviceId: e.target.value })
              }
              className="admin-input"
            >
              <option value="">בחר שירות</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · ₪{s.price}
                </option>
              ))}
            </select>
            <select
              value={walkIn.providerId}
              onChange={(e) =>
                setWalkIn({ ...walkIn, providerId: e.target.value })
              }
              className="admin-input"
            >
              <option value="">בחר ספר</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button onClick={handleSaveWalkIn} className="btn-primary">
              שמירת תור
            </button>
            <button onClick={() => setActiveModal(null)} className="btn-ghost">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* 2. טופס חסימת שעות */}
      {activeModal === "block-hour" && (
        <div className="form-card">
          <div className="form-card-title">חסימת טווח שעות</div>
          <div className="form-grid">
            <input
              type="time"
              value={blockHour.startTime}
              onChange={(e) =>
                setBlockHour({ ...blockHour, startTime: e.target.value })
              }
              className="admin-input"
            />
            <input
              type="time"
              value={blockHour.endTime}
              onChange={(e) =>
                setBlockHour({ ...blockHour, endTime: e.target.value })
              }
              className="admin-input"
            />
            <select
              value={blockHour.providerId}
              onChange={(e) =>
                setBlockHour({ ...blockHour, providerId: e.target.value })
              }
              className="admin-input"
            >
              <option value="">כל הספרים</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              placeholder="סיבה (למשל: הפסקת צהריים)"
              value={blockHour.reason}
              onChange={(e) =>
                setBlockHour({ ...blockHour, reason: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div className="form-actions">
            <button onClick={handleSaveBlockHour} className="btn-primary">
              בצע חסימת שעות
            </button>
            <button onClick={() => setActiveModal(null)} className="btn-ghost">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* 3. טופס חסימת יום */}
      {activeModal === "block-day" && (
        <div className="form-card">
          <div className="form-card-title">חסימת יום מלא</div>
          <div className="form-grid">
            <select
              value={blockDay.providerId}
              onChange={(e) =>
                setBlockDay({ ...blockDay, providerId: e.target.value })
              }
              className="admin-input"
            >
              <option value="">כל העסק סגור</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} בלבד
                </option>
              ))}
            </select>
            <input
              placeholder="סיבת חופש (למשל: יום מילואים / מחלה)"
              value={blockDay.reason}
              onChange={(e) =>
                setBlockDay({ ...blockDay, reason: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div className="form-actions">
            <button onClick={handleSaveBlockDay} className="btn-primary">
              סמן יום חופש
            </button>
            <button onClick={() => setActiveModal(null)} className="btn-ghost">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* רשימת התורים ביומן */}
      <div className="table-card">
        {loading ? (
          <div className="empty-state">טוען יומן תורים...</div>
        ) : appointments.length > 0 ? (
          appointments.map((apt) => {
            const time = apt.dateTime
              ? new Date(apt.dateTime).toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })
              : "--:--";

            const isBlock = apt.service?.name?.startsWith("חסום");
            const clientName = isBlock
              ? "שעה חסומה 🔒"
              : apt.user?.firstName
                ? `${apt.user.firstName} ${apt.user.lastName || ""}`.trim()
                : "לקוח מזדמן";

            const providerName = apt.provider?.name || "—";

            return (
              <div
                key={apt.id}
                className={`appointment-row ${isBlock ? "row-blocked" : ""}`}
              >
                <div className="apt-time">{time}</div>
                <div className="apt-info">
                  <div className="apt-client">{clientName}</div>
                  <div className="apt-service">
                    {apt.service?.name || "תספורת"}
                  </div>
                </div>
                <div className="apt-provider">
                  <div className="provider-avatar-small">
                    {providerName.slice(0, 1)}
                  </div>
                  <span className="provider-name">{providerName}</span>
                </div>

                {isBlock ? (
                  <button
                    onClick={() => handleUnblockHour(apt)}
                    className="btn-unblock-row"
                    title="שחרר שעה זו לתורים"
                  >
                    שחרר חסימה ✕
                  </button>
                ) : (
                  <button
                    onClick={() => handleCycleStatus(apt)}
                    className={`badge-status-btn status-${apt.status.toLowerCase()}`}
                    title="לחץ לשינוי סטטוס"
                  >
                    {STATUS_LABELS[apt.status] || apt.status}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">אין תורים או חסימות במועד זה.</div>
        )}
      </div>

      {/* Modal אישור מעוצב */}
      {confirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">אישור פעולה</h3>
            <p className="modal-body">{confirmModal.message}</p>
            <div className="modal-actions">
              <button onClick={confirmModal.onConfirm} className="btn-primary">
                אישור
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="btn-ghost"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
