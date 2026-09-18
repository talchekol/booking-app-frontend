import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import LoginSMS from "./components/LoginSMS/LoginSMS";
import { checkSlugAvailabilityApi, registerBusinessApi } from "./services/api";
import "./components/LoginSMS/LoginSMS.css";

// ניקוי הקלט בזמן אמת: אותיות אנגלית קטנות, ספרות ומקפים בלבד
const sanitizeSlug = (raw) =>
  raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const SLUG_STATUS_TEXT = {
  checking: "בודק זמינות...",
  available: "כתובת זו פנויה!",
  taken: "כתובת זו כבר תפוסה, נסה אחרת",
  reserved: "כתובת זו שמורה ואינה זמינה",
  invalid: "כתובת חייבת להכיל 3 תווים לפחות (אותיות/ספרות/מקפים)",
};

// מסך הרשמת עסק חדש: מזהה משתמש (OTP קיים) ואז קולט שם עסק + כתובת URL ייחודית
export default function RegisterBusiness({ user, setUser }) {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [slugStatus, setSlugStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkTimer = useRef(null);

  // משתמש שכבר בעל עסק (ADMIN) - אין לו מה לעשות פה, מנתבים אותו ללוח הבקרה
  useEffect(() => {
    if (user?.role === "ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, []);

  if (!user) {
    return <LoginSMS onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  if (user.role === "ADMIN") {
    return null; // מנווט כרגע ב-useEffect
  }

  const handleSlugChange = (raw) => {
    const cleaned = sanitizeSlug(raw);
    setSlug(cleaned);
    setSlugStatus(null);

    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (cleaned.length < 3) return;

    checkTimer.current = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const res = await checkSlugAvailabilityApi(cleaned);
        setSlugStatus(res.available ? "available" : res.reason || "taken");
      } catch (err) {
        setSlugStatus(null);
      }
    }, 400);
  };

  const handleSlugBlur = () => {
    // ניקוי מקפים בהתחלה/בסוף רק כשהמשתמש סיים להקליד, לא על כל הקשה
    setSlug((prev) => prev.replace(/^-+|-+$/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessName.trim() || !slug) {
      setError("נא למלא שם עסק וכתובת URL");
      return;
    }
    if (slugStatus !== "available") {
      setError("כתובת ה-URL אינה זמינה, בחר כתובת אחרת ונסה שוב");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await registerBusinessApi({
        slug,
        name: businessName.trim(),
        address: address.trim() || undefined,
      });

      // קודם דורסים את הטוקן/המשתמש הישנים (role: CLIENT) בפועל, ורק אז מנווטים -
      // אחרת ה-Dashboard עלול לזרוק בחזרה למסך ההתחברות לפני שהטוקן החדש נכנס לתוקף
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);

      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "שגיאה ברישום העסק, נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const previewUrl = slug ? `${window.location.origin}/${slug}` : "";

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="header-section">
          <div className="logo-wrapper">
            <Store size={36} />
          </div>
          <h1 className="main-title">פתיחת עסק חדש</h1>
          <p className="sub-title">כמה פרטים ותוכל להתחיל לקבל תורים</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="sms-form">
          <div className="input-group">
            <label className="input-label">שם העסק</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="למשל: מספרת דנה"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">כתובת URL ייחודית לעסק</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="dana-barber"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSlugBlur}
                className="form-input"
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
            {previewUrl && (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }} dir="ltr">
                {previewUrl}
              </p>
            )}
            {slugStatus && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color:
                    slugStatus === "available"
                      ? "#16a34a"
                      : slugStatus === "checking"
                        ? "#64748b"
                        : "#dc2626",
                }}
              >
                {slugStatus === "checking" && <Loader2 size={14} className="spinner" />}
                {slugStatus === "available" && <CheckCircle2 size={14} />}
                {slugStatus !== "checking" && slugStatus !== "available" && (
                  <XCircle size={14} />
                )}
                {SLUG_STATUS_TEXT[slugStatus]}
              </p>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">כתובת (אופציונלי)</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="למשל: ויצמן 12, כפר סבא"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="submit-btn verify-btn">
            {submitting ? (
              <>
                <Loader2 className="spinner" size={20} />
                <span>יוצר עסק...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>יצירת העסק</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
