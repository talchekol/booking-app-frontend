import React, { useState } from "react";
import "./ServicesStaffTab.css";
import {
  createServiceApi,
  deleteServiceApi,
  createProviderApi,
  deleteProviderApi,
} from "../../../services/api";

const PROVIDER_COLORS = ["#6D28D9", "#16A34A", "#F59E0B", "#0EA5E9"];

// רכיב ניהול שירותים וצוות
export default function ServicesStaffTab({ services, providers, onUpdate }) {
  const [addingService, setAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    duration: "",
    price: "",
  });

  // פונקציות לניהול שירותים
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: "", imageUrl: "" });

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
      alert("שגיאה בהוספת שירות");
    }
  };

  //פונקציה למחיקת שירות
  const handleDeleteService = async (id) => {
    if (!window.confirm("האם למחוק שירות זה?")) return;
    try {
      await deleteServiceApi(id);
      onUpdate();
    } catch (err) {
      alert("שגיאה במחיקת שירות (ייתכן שתלויים בו תורים)");
    }
  };

  //פונקציה לשמירת ספר חדש
  const handleSaveProvider = async () => {
    if (!newProvider.name) return;
    try {
      await createProviderApi({
        name: newProvider.name,
        imageUrl: newProvider.imageUrl || undefined,
      });
      setAddingProvider(false);
      setNewProvider({ name: "", imageUrl: "" });
      onUpdate();
    } catch (err) {
      alert("שגיאה בהוספת ספר");
    }
  };

  //פונקציה להסרת ספר
  const handleDeleteProvider = async (id) => {
    if (!window.confirm("האם להסיר ספר זה מהצוות?")) return;
    try {
      await deleteProviderApi(id);
      onUpdate();
    } catch (err) {
      alert("שגיאה בהסרת ספר");
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
              + ספר
            </button>
          </div>

          {addingProvider && (
            <div className="sub-form">
              <input
                placeholder="שם ספר"
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
                <div className="item-name" style={{ flex: 1 }}>
                  {p.name}
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
    </div>
  );
}
