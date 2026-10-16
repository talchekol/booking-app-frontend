import React, { useState } from "react";
import "./ServicesStaffTab.css";
import {
  createServiceApi,
  deleteServiceApi,
  createProviderApi,
  deleteProviderApi,
} from "../../../services/api";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import { useToast } from "../../../context/ToastContext";

const PROVIDER_COLORS = ["#6D28D9", "#16A34A", "#F59E0B", "#0EA5E9"];

// רכיב ניהול שירותים וצוות
export default function ServicesStaffTab({ services, providers, onUpdate }) {
  const { showToast } = useToast();
  const [addingService, setAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    duration: "",
    price: "",
  });

  // פונקציות לניהול שירותים
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: "",
    imageUrl: "",
    description: "",
  });

  // מודל אישור אחיד למחיקת שירות/הסרת ספר - { type: "service" | "provider", id }
  const [pendingDelete, setPendingDelete] = useState(null);

  //פונקציה לשמירת שירות חדש
  const handleSaveService = async () => {
    if (!newService.name || !newService.price || !newService.duration) return;
    try {
      await createServiceApi({
        name: newService.name,
        price: Number(newService.price),
        durationMin: Number(newService.duration),
      });
      setAddingService(false);
      setNewService({ name: "", duration: "", price: "" });
      onUpdate();
    } catch (err) {
      showToast("שגיאה בהוספת שירות", "error");
    }
  };

  //פונקציה למחיקת שירות
  const handleDeleteService = (id) => {
    setPendingDelete({ type: "service", id });
  };

  //פונקציה לשמירת איש צוות חדש
  const handleSaveProvider = async () => {
    if (!newProvider.name) return;
    try {
      await createProviderApi({
        name: newProvider.name,
        imageUrl: newProvider.imageUrl || undefined,
        description: newProvider.description || undefined,
      });
      setAddingProvider(false);
      setNewProvider({ name: "", imageUrl: "", description: "" });
      onUpdate();
    } catch (err) {
      showToast("שגיאה בהוספת איש צוות", "error");
    }
  };

  //פונקציה להסרת איש צוות
  const handleDeleteProvider = (id) => {
    setPendingDelete({ type: "provider", id });
  };

  // ביצוע בפועל אחרי אישור במודל
  const handleConfirmDelete = async () => {
    const { type, id } = pendingDelete;
    setPendingDelete(null);
    try {
      if (type === "service") {
        await deleteServiceApi(id);
      } else {
        await deleteProviderApi(id);
      }
      onUpdate();
    } catch (err) {
      showToast(
        type === "service"
          ? "שגיאה במחיקת שירות (ייתכן שתלויים בו תורים)"
          : "שגיאה בהסרת איש צוות",
        "error",
      );
    }
  };

  return (
    <div className="tab-pane">
      <h2 className="pane-title">שירותים וצוות</h2>
      <div className="two-col-grid">
        {/* Services Box */}
        <div className="card-box">
          <div className="card-box-header">
            <div className="box-title">שירותים</div>
            <button
              onClick={() => setAddingService(!addingService)}
              className="btn-small-primary"
            >
              + שירות
            </button>
          </div>

          {addingService && (
            <div className="sub-form">
              <input
                placeholder="שם שירות (למשל: תספורת גבר)"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                className="admin-input"
              />
              <div className="input-group-row">
                <input
                  placeholder="דקות"
                  type="number"
                  value={newService.duration}
                  onChange={(e) =>
                    setNewService({ ...newService, duration: e.target.value })
                  }
                  className="admin-input"
                />
                <input
                  placeholder="מחיר ₪"
                  type="number"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService({ ...newService, price: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
              <div className="form-actions">
                <button onClick={handleSaveService} className="btn-primary">
                  שמירה
                </button>
                <button
                  onClick={() => setAddingService(false)}
                  className="btn-ghost"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          <div className="items-list">
            {services.map((s) => (
              <div key={s.id} className="item-row">
                <div className="item-details">
                  <div className="item-name">{s.name}</div>
                  <div className="item-sub">
                    {s.durationMin || s.duration} דק׳ · ₪{s.price}
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="btn-icon-danger"
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff / Providers Box */}
        <div className="card-box">
          <div className="card-box-header">
            <div className="box-title">צוות</div>
            <button
              onClick={() => setAddingProvider(!addingProvider)}
              className="btn-small-primary"
            >
              + איש צוות
            </button>
          </div>

          {addingProvider && (
            <div className="sub-form">
              <input
                placeholder="שם איש צוות"
                value={newProvider.name}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, name: e.target.value })
                }
                className="admin-input"
              />
              <input
                placeholder="קישור לתמונת פרופיל (אופציונלי)"
                value={newProvider.imageUrl}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, imageUrl: e.target.value })
                }
                className="admin-input"
              />
              <textarea
                placeholder="תיאור (אופציונלי) - יוצג גם ללקוח"
                value={newProvider.description}
                onChange={(e) =>
                  setNewProvider({
                    ...newProvider,
                    description: e.target.value,
                  })
                }
                className="admin-input"
                rows={3}
              />
              <div className="form-actions">
                <button onClick={handleSaveProvider} className="btn-primary">
                  שמירה
                </button>
                <button
                  onClick={() => setAddingProvider(false)}
                  className="btn-ghost"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          <div className="items-list">
            {providers.map((p, idx) => (
              <div key={p.id} className="item-row">
                <div
                  className="provider-avatar"
                  style={{
                    backgroundColor:
                      PROVIDER_COLORS[idx % PROVIDER_COLORS.length],
                  }}
                >
                  {p.name.slice(0, 1)}
                </div>
                <div className="item-details" style={{ flex: 1 }}>
                  <div className="item-name">{p.name}</div>
                  {p.description && (
                    <div className="item-sub">{p.description}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteProvider(p.id)}
                  className="btn-icon-danger"
                >
                  הסרה
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={
          pendingDelete?.type === "service" ? "מחיקת שירות" : "הסרת איש צוות"
        }
        message={
          pendingDelete?.type === "service"
            ? "האם למחוק שירות זה? הפעולה בלתי הפיכה."
            : "האם להסיר איש צוות זה? הפעולה בלתי הפיכה."
        }
        confirmText={pendingDelete?.type === "service" ? "מחק" : "הסר"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
