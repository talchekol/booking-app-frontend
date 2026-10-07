import React, { useState, useEffect } from "react";
import "./CalendarTab.css";
import {
  getMyAppointmentsAdminApi,
  updateAppointmentStatusApi,
  createManualAppointmentApi,
  blockTimeRangeApi,
  getMyBlockedDaysApi,
  blockFullDayApi,
  unblockFullDayApi,
  unblockAppointmentApi,
  getMySettingsApi,
  updateBusinessSettingsApi,
} from "../../../services/api";
import {
  getLocalDateString,
  extractTimeFromIso,
  getTimeRangeDisplay,
} from "../../../utils/dateUtils";
import { useToast } from "../../../context/ToastContext";

const STATUS_CYCLE = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const STATUS_LABELS = {
  CONFIRMED: "מאושר",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
  NO_SHOW: "לא הגיע",
};

export default function CalendarTab({ services = [], providers = [] }) {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [blockedDays, setBlockedDays] = useState([]);
  const [dateOffset, setDateOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // מודלים וטפסים
  const [activeModal, setActiveModal] = useState(null); // 'walkin' | 'block-hour' | 'block-day' | 'settings' | null
  const [confirmModal, setConfirmModal] = useState(null);

  // State הגדרות שעות ומרווחים
  const [businessSettings, setBusinessSettings] = useState({
    openTime: "09:00",
    closeTime: "19:30",
    slotInterval: 30,
  });

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
    return getLocalDateString(getTargetDate(offset));
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
        getMyAppointmentsAdminApi(dateStr),
        getMyBlockedDaysApi(dateStr).catch(() => []),
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

  // טעינת הגדרות שעות הפעילות של העסק
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getMySettingsApi();
        if (data) {
          setBusinessSettings({
            openTime: data.openTime || "09:00",
            closeTime: data.closeTime || "19:30",
            slotInterval: data.slotInterval || 30,
          });
        }
      } catch (e) {
        console.error("שגיאה בטעינת הגדרות עסק:", e);
      }
    };
    fetchSettings();
  }, []);

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
      showToast("שגיאה בעדכון סטטוס התור", "error");
    }
  };

  // ביטול חסימת שעה בודדת או טווח
  const handleUnblockHour = (apt) => {
    setConfirmModal({
      message: "האם לבטל את החסימה ולפתוח את טווח השעות הזה לתורים?",
      onConfirm: async () => {
        try {
          await unblockAppointmentApi(apt.id);
          setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
        } catch (e) {
          showToast("שגיאה בשחרור החסימה", "error");
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
          showToast("שגיאה בביטול חסימת היום", "error");
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
      showToast("נא למלא את כל השדות לקביעת תור ידני", "error");
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
      showToast(err.message || "שגיאה בקביעת תור", "error");
    }
  };

  // שמירת חסימת שעות (מהירה עם סגירת מודאל מיידית)
  const handleSaveBlockHour = async () => {
    const dateStr = getDateString(dateOffset);
    const payload = {
      date: dateStr,
      startTime: blockHour.startTime,
      endTime: blockHour.endTime,
      providerId: blockHour.providerId || undefined,
      reason: blockHour.reason,
    };

    setActiveModal(null);
    try {
      await blockTimeRangeApi(payload);
      loadData();
    } catch (err) {
      showToast(err.message || "שגיאה בחסימת השעות", "error");
      loadData();
    }
  };

  // שמירת חסימת יום
  const handleSaveBlockDay = async () => {
    const dateStr = getDateString(dateOffset);
    const payload = {
      date: dateStr,
      providerId: blockDay.providerId || undefined,
      reason: blockDay.reason,
    };

    setActiveModal(null);
    try {
      await blockFullDayApi(payload);
      loadData();
    } catch (err) {
      showToast(err.message || "שגיאה בחסימת היום", "error");
      loadData();
    }
  };

  // שמירת הגדרות שעות פעילות ומרווח
  const handleSaveBusinessSettings = async () => {
    const previousSettings = { ...businessSettings };
    setActiveModal(null);

    try {
      await updateBusinessSettingsApi(businessSettings);
    } catch (err) {
      console.error("שגיאה בשמירת הגדרות עסק בשרת:", err);
      setBusinessSettings(previousSettings);
      showToast(err.message || "אירעה שגיאה בשמירת הגדרות העסק בשרת.", "error");
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
            onClick={() =>
              setActiveModal(activeModal === "settings" ? null : "settings")
            }
            className="btn-secondary"
          >
            ⚙️ שעות ומרווח
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

      {/* 4. טופס הגדרת שעות פעילות ומרווח */}
      {activeModal === "settings" && (
        <div className="form-card">
          <div className="form-card-title">הגדרת שעות פעילות ומרווחי תורים</div>
          <div className="form-grid">
            <div>
              <label style={{ fontSize: "12px", color: "#64748b" }}>
                שעת פתיחה:
              </label>
              <input
                type="time"
                value={businessSettings.openTime}
                onChange={(e) =>
                  setBusinessSettings({
                    ...businessSettings,
                    openTime: e.target.value,
                  })
                }
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b" }}>
                שעת סגירה:
              </label>
              <input
                type="time"
                value={businessSettings.closeTime}
                onChange={(e) =>
                  setBusinessSettings({
                    ...businessSettings,
                    closeTime: e.target.value,
                  })
                }
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b" }}>
                מרווח בין תורים:
              </label>
              <select
                value={businessSettings.slotInterval}
                onChange={(e) =>
                  setBusinessSettings({
                    ...businessSettings,
                    slotInterval: Number(e.target.value),
                  })
                }
                className="admin-input"
              >
                <option value={15}>15 דקות</option>
                <option value={20}>20 דקות</option>
                <option value={30}>30 דקות</option>
                <option value={45}>45 דקות</option>
                <option value={60}>שעה (60 דקות)</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button
              onClick={handleSaveBusinessSettings}
              className="btn-primary"
            >
              שמור הגדרות
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
            const isBlock = apt.service?.name?.startsWith("חסום");

            // חישוב טווח שעות מלא (למשל: "12:00 - 14:00") עבור חסימות
            const timeDisplay =
              isBlock && apt.service?.durationMin
                ? getTimeRangeDisplay(apt.dateTime, apt.service.durationMin)
                : extractTimeFromIso(apt.dateTime);

            const clientName = isBlock
              ? "שעה חסומה 🔒"
              : apt.user?.firstName
                ? `${apt.user.firstName} ${apt.user.lastName || ""}`.trim()
                : "לקוח מזדמן";

            // אם בחסימה לא הוגדר ספר ספציפי, יוצג "כל הספרים"
            const providerName =
              apt.provider?.name || (isBlock ? "כל הספרים" : "—");

            return (
              <div
                key={apt.id}
                className={`appointment-row ${isBlock ? "row-blocked" : ""}`}
              >
                <div
                  className="apt-time"
                  style={{
                    direction: "ltr",
                    minWidth: isBlock ? "105px" : "auto",
                  }}
                >
                  {timeDisplay}
                </div>
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
