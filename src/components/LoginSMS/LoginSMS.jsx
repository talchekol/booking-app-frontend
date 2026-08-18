import React, { useState } from "react";
import axios from "axios";
import {
  Phone,
  Lock,
  ArrowLeft,
  CheckCircle2,
  User,
  Store,
} from "lucide-react";
import "./LoginSMS.css";

const API_BASE_URL = "http://localhost:5000";

export default function LoginSMS({ onLoginSuccess, businessLogoUrl }) {
  const [step, setStep] = useState(1); // 1 = טלפון, 2 = קוד SMS, 3 = הרשמה (שם ושם משפחה)
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. שליחת קוד SMS
  const handleSendSMS = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      setError("נא להזין מספר טלפון תקין");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/auth/send-sms`, { phone });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "שגיאה בשליחת הקוד, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  // 2. אימות קוד SMS
  const handleVerifySMS = async (e) => {
    e.preventDefault();
    if (!code || code.length < 4) {
      setError("נא להזין קוד בן 4 ספרות");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-sms`, {
        phone,
        code,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUserData(user);

      // אם זה משתמש חדש (או שאין לו עדיין שם), נעביר אותו לשלב הרשמה (שלב 3)
      if (user.isNewUser || !user.firstName) {
        setStep(3);
      } else {
        if (onLoginSuccess) onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.response?.data?.error || "קוד שגוי או פג תוקף");
    } finally {
      setLoading(false);
    }
  };

  // 3. השלמת פרטי הרשמה (שם פרטי ושם משפחה)
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("נא להזין שם פרטי ושם משפחה");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // עדכון פרטי המשתמש בבאקנד
      const response = await axios.put(
        `${API_BASE_URL}/users/profile`,
        { firstName, lastName },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedUser = {
        ...userData,
        firstName,
        lastName,
        isNewUser: false,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (onLoginSuccess) onLoginSuccess(updatedUser);
    } catch (err) {
      setError(
        err.response?.data?.error || "לא הצלחנו לשמור את הפרטים, אנא נסה שוב",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* ראש הכרטיסייה: לוגו העסק או אייקון דיפולטיבי */}
        <div className="header-section">
          <div className="logo-wrapper">
            {businessLogoUrl ? (
              <img
                src={businessLogoUrl}
                alt="לוגו העסק"
                className="business-logo"
              />
            ) : (
              <Store size={36} />
            )}
          </div>

          <h1 className="main-title">
            {step === 1 && "התחברות למערכת"}
            {step === 2 && "אימות קוד SMS"}
            {step === 3 && "ברוך הבא! נעים להכיר"}
          </h1>

          <p className="sub-title">
            {step === 1 && "הזן את מספר הטלפון שלך כדי להתחיל"}
            {step === 2 && `הזן את הקוד ששלחנו ל- ${phone}`}
            {step === 3 && "אנא הזן את פרטיך האישיים להשלמת ההרשמה"}
          </p>
        </div>

        {/* הצגת שגיאות */}
        {error && <div className="error-message">{error}</div>}

        {/* שלב 1: הזנת טלפון */}
        {step === 1 && (
          <form onSubmit={handleSendSMS} className="sms-form">
            <div className="input-group">
              <label className="input-label">מספר טלפון</label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  placeholder="0500000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  dir="ltr"
                />
                <Phone size={20} className="field-icon" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "שולח..." : "שלח קוד אימות"}
            </button>
          </form>
        )}

        {/* שלב 2: הזנת קוד SMS */}
        {step === 2 && (
          <form onSubmit={handleVerifySMS} className="sms-form">
            <div className="input-group">
              <label className="input-label">קוד אימות (4 ספרות)</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  maxLength="4"
                  placeholder="1234"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="form-input code-input"
                  dir="ltr"
                />
                <Lock size={20} className="field-icon" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn verify-btn"
            >
              <CheckCircle2 size={20} />
              {loading ? "מאמת..." : "אמת והמשך"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="back-btn"
            >
              <ArrowLeft size={16} /> חזור להחלפת טלפון
            </button>
          </form>
        )}

        {/* שלב 3: השלמת הרשמה למשתמש חדש (שם פרטי ושם משפחה) */}
        {step === 3 && (
          <form onSubmit={handleCompleteRegistration} className="sms-form">
            <div className="name-row">
              <div className="input-group">
                <label className="input-label">שם פרטי</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="ישראל"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                  />
                  <User size={18} className="field-icon" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">שם משפחה</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="ישראלי"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                  />
                  <User size={18} className="field-icon" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn verify-btn"
            >
              <CheckCircle2 size={20} />
              {loading ? "שומר..." : "סיום והתחברות"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
