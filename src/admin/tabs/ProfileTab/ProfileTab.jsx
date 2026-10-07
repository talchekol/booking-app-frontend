import React, { useState, useEffect } from "react";
import { Loader2, Save, Check, Link2, Copy } from "lucide-react";
import {
  getBusinessProfileApi,
  updateBusinessProfileApi,
} from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import "./ProfileTab.css";

export default function ProfileTab({ onBusinessUpdated }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    name: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    tiktok: "",
  });
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getBusinessProfileApi();
        if (data) {
          setProfile({
            name: data.name || "",
            address: data.address || "",
            phone: data.phone || "",
            whatsapp: data.whatsapp || "",
            instagram: data.instagram || "",
            tiktok: data.tiktok || "",
          });
          setSlug(data.slug || "");
        }
      } catch (err) {
        console.error("שגיאה בטעינת פרופיל:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const publicLink = slug ? `${window.location.origin}/${slug}` : "";

  const handleCopyLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      showToast("לא ניתן להעתיק אוטומטית - " + publicLink, "error");
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateBusinessProfileApi(profile);
      setSavedSuccess(true);
      if (typeof onBusinessUpdated === "function") {
        onBusinessUpdated(res.business);
      }
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      showToast(err.message || "שגיאה בשמירה", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="tab-pane">
        <div className="loading-state-row">
          <Loader2 className="spinner" size={20} />
          <span>טוען הגדרות עסק...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane">
      <h2 className="pane-title">הגדרות עסק ופרטי התקשרות</h2>

      {publicLink && (
        <div className="card-box profile-card-box" style={{ marginBottom: 16 }}>
          <div className="box-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link2 size={16} />
            <span>הקישור הציבורי לעסק שלך</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span dir="ltr" style={{ fontSize: "0.9rem", color: "#334155" }}>
              {publicLink}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="save-btn"
              style={{ padding: "6px 14px" }}
            >
              {linkCopied ? (
                <>
                  <Check size={15} />
                  <span>הועתק!</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>העתק קישור</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="card-box profile-card-box">
        <form onSubmit={handleSave}>
          <div className="profile-form-grid">
            <div className="form-group">
              <label className="field-label">שם העסק</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="admin-input"
                placeholder="הזן את שם העסק"
                required
              />
            </div>

            <div className="form-group">
              <label className="field-label">כתובת (לווייז ולמפות)</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="admin-input"
                placeholder="למשל: ויצמן 12, כפר סבא"
              />
            </div>

            <div className="form-group">
              <label className="field-label">טלפון לחיוג</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="admin-input"
                placeholder="למשל: 0521234567"
              />
            </div>

            <div className="form-group">
              <label className="field-label">מספר לוואטסאפ</label>
              <input
                type="text"
                value={profile.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                className="admin-input"
                placeholder="מספר טלפון ללא מקפים"
              />
            </div>

            <div className="form-group">
              <label className="field-label">קישור לאינסטגרם</label>
              <input
                type="url"
                value={profile.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                className="admin-input"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="form-group">
              <label className="field-label">קישור לטיקטוק</label>
              <input
                type="url"
                value={profile.tiktok}
                onChange={(e) => handleChange("tiktok", e.target.value)}
                className="admin-input"
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>

          <div className="profile-actions-bar">
            <button
              type="submit"
              className={`save-btn ${savedSuccess ? "success" : ""}`}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="spinner" size={17} />
                  <span>שומר...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check size={17} />
                  <span>השינויים נשמרו בהצלחה!</span>
                </>
              ) : (
                <>
                  <Save size={17} />
                  <span>שמור שינויים</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
