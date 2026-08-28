import React, { useState, useEffect } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import LoginSMS from "./components/LoginSMS/LoginSMS";
import Home from "./components/Home/Home";
import SelectService from "./components/SelectService/SelectService";
import SelectBarber from "./components/SelectBarber/SelectBarber";
import SelectDateTime from "./components/SelectDateTime/SelectDateTime";
import ConfirmScreen from "./components/ConfirmScreen/ConfirmScreen";
import Swaps from "./components/Swaps/Swaps";
import Messages from "./components/Messages/Messages";
import MyAppointments from "./components/MyAppointments/MyAppointments";
import Profile from "./components/Profile/Profile";
import {
  getMyAppointmentsApi,
  cancelAppointmentApi,
  toggleSwapOfferApi,
  createNewAppointment,
  createSwapRequestApi,
  getBusinessAppointmentsApi,
  updateAppointmentStatusApi,
} from "./services/api";
import {
  CheckCircle2,
  HomeIcon,
  Calendar,
  Repeat,
  MessageSquare,
  User,
} from "lucide-react";
import "./App.css";

// TODO: SelectService/SelectBarber עדיין מציגים נתוני דמה עם מזהים מומצאים
// (לא UUID-ים אמיתיים מה-DB), כי מסך ניהול העסק שדרכו ייווצרו שירותים/ספקים
// אמיתיים עדיין לא בנוי. עד אז קביעת תור מחוברת לעסק/ספק/שירות היחיד שנוצר
// ב-seed.js, ובחירת השירות/הספר במסכים משמשת לתצוגה בלבד. יש לחבר בפועל
// ל-selectedBookingData.service.id / .barber.id ברגע שהנתונים האלה יגיעו מה-DB.
const DEFAULT_BUSINESS_ID = "1c7ac3d9-03a5-4f9d-8d7f-3bd1fb1f53fd";
const DEFAULT_PROVIDER_ID = "d285ea0c-8371-40f2-a642-9689db7199ac";
const DEFAULT_SERVICE_ID = "0f1f9edb-5d06-49bf-b9dd-9d3babe653c2";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // ניהול השלב הנוכחי בתהליך קביעת התור
  // 'home' | 'select-service' | 'select-barber' | 'select-datetime' | 'confirm'
  const [currentTab, setCurrentTab] = useState("home");
  const [bookingStep, setBookingStep] = useState("home");
  const [selectedBookingData, setSelectedBookingData] = useState({});
  // 👈 שמירת מזהה הצעת ההחלפה הממתינה
  const [pendingSwapId, setPendingSwapId] = useState(() => {
    try {
      return localStorage.getItem("pendingSwapId") || null;
    } catch (e) {
      return null;
    }
  });

  // State לתור הקרוב והיסטוריה מהשרת
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [appointmentsHistory, setAppointmentsHistory] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // 👈 טעינת התורים מ-Neon בטעינה ראשונה וכשהמשתמש מחובר
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    setLoadingAppts(true);
    try {
      const data = await getMyAppointmentsApi();
      // השרת מחזיר אובייקט עם upcoming ו-history
      setUpcomingAppointment(data.upcoming || null);
      setAppointmentsHistory(data.history || []);
    } catch (err) {
      console.error("שגיאה בטעינת תורים מהשרת:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

  // בחירת שירות ומעבר לשלב הבא
  const handleSelectService = (service) => {
    setSelectedBookingData((prev) => ({ ...prev, service }));
    setBookingStep("select-barber"); // יעבור למסך בחירת ספר!
  };

  // 2. שמירת ספר ומעבר לבחירת תאריך ושעה
  const handleSelectBarber = (barber) => {
    setSelectedBookingData((prev) => ({ ...prev, barber }));
    setBookingStep("select-datetime");
  };

  // 3. שמירת תאריך ושעה ומעבר למסך אישור פרטים
  const handleSelectDateTime = ({ date, time, dayName }) => {
    setSelectedBookingData((prev) => ({ ...prev, date, time, dayName }));
    setBookingStep("confirm");
  };

  // אישור סופי של קביעת תור מול השרת
  const handleFinalConfirm = async (finalData) => {
    try {
      // הרכבת מחרוזת תאריך ושעה ישירה ב-UTC
      const dateTimeUtc = `${finalData.date}T${finalData.time}:00.000Z`;

      // ראו הערת TODO למעלה - מזהים קבועים עד שבחירת השירות/הספר תתחבר ל-DB אמיתי
      const appointmentPayload = {
        businessId: DEFAULT_BUSINESS_ID,
        providerId: selectedBookingData.barber?.id || DEFAULT_PROVIDER_ID,
        serviceId: selectedBookingData.service?.id || DEFAULT_SERVICE_ID,
        dateTime: dateTimeUtc,
      };

      // שליחה אסינכרונית ל-Node.js -> PostgreSQL
      await createNewAppointment(appointmentPayload);

      // רענון התור הקרוב וההיסטוריה בלייב מ-Neon
      await loadAppointments();

      // מעבר למסך ההצלחה
      setBookingStep("success");
    } catch (err) {
      console.error("שגיאה ביצירת התור בשרת:", err);
      alert(err.message || "אירעה שגיאה בקביעת התור, אנא נסה שוב");
    }
  };

  // ביטול תור (מעודכן מול השרת)
  const handleCancelAppointment = async () => {
    if (upcomingAppointment?.id) {
      try {
        await cancelAppointmentApi(upcomingAppointment.id);
        loadAppointments(); // רענון מהשרת
      } catch (err) {
        console.error("שגיאה בביטול התור:", err);
        alert(err.message || "אירעה שגיאה בביטול התור, אנא נסה שוב");
      }
    } else {
      setUpcomingAppointment(null);
      localStorage.removeItem("upcomingAppointment");
    }
  };

  // שינוי מצב הצעה להחלפה (Toggle מעודכן מול השרת)
  const handleToggleSwapOffer = async () => {
    if (!upcomingAppointment) return;

    if (upcomingAppointment.id) {
      try {
        await toggleSwapOfferApi(upcomingAppointment.id);
        loadAppointments(); // רענון התור המעודכן מהשרת
      } catch (err) {
        console.error("שגיאה בריענון מצב החלפה:", err);
        alert(err.message || "אירעה שגיאה בעדכון הצעת ההחלפה, אנא נסה שוב");
      }
    } else {
      const updatedAppt = {
        ...upcomingAppointment,
        isUpForSwap: !upcomingAppointment.isUpForSwap,
      };
      setUpcomingAppointment(updatedAppt);
    }
  };

  // בקשת החלפת תור - item הוא SwapOffer עם appointment מקונן בתוכו
  const handleRequestSwap = (item) => {
    const targetAppt = item?.appointment || item;
    const targetUser = targetAppt?.user;
    const otherUserName = targetUser?.firstName
      ? `${targetUser.firstName} ${targetUser.lastName || ""}`.trim()
      : "משתמש";

    setSelectedBookingData({
      myAppt: upcomingAppointment,
      targetAppt,
      otherUserName,
      swapOfferId: item.id,
    });
    setBookingStep("confirm-swap");
  };

  // סיום תהליך אישור ההחלפה - שליחת בקשת ההחלפה בפועל לשרת
  const handleConfirmSwapFinal = async (confirmedData) => {
    const swapOfferId = confirmedData?.swapOfferId;

    if (swapOfferId && upcomingAppointment?.id) {
      try {
        await createSwapRequestApi(swapOfferId, upcomingAppointment.id);
        setPendingSwapId(swapOfferId);
        localStorage.setItem("pendingSwapId", String(swapOfferId));
      } catch (err) {
        console.error("שגיאה בשליחת בקשת ההחלפה:", err);
        alert(err.message || "אירעה שגיאה בשליחת בקשת ההחלפה, אנא נסה שוב");
      }
    }

    setBookingStep("home");
    setCurrentTab("swaps");
  };

  // רענון התורים לאחר שהחלפה בוצעה/טופלה בלשונית ההחלפות
  const handleSwapChanged = () => {
    setPendingSwapId(null);
    localStorage.removeItem("pendingSwapId");
    loadAppointments();
  };

  // התנתקות מהחשבון
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setUpcomingAppointment(null);
  };

  return (
    <div>
      {!user ? (
        <LoginSMS onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
      ) : user.role === "ADMIN" ? (
        /* תצוגת מסך ניהול לבעל העסק */
        <div className="admin-app-wrapper">
          <AdminDashboard businessName="מספרת טל" onLogout={handleLogout} />
        </div>
      ) : (
        /* תצוגת אפליקציית מובייל ללקוח */
        <div className="client-mobile-wrapper">
          {bookingStep === "home" && (
            <>
              {/* תצוגת דף הבית */}
              {currentTab === "home" && (
                <Home
                  user={user}
                  upcomingAppt={upcomingAppointment}
                  onStartBooking={() => setBookingStep("select-service")}
                  onCancelAppointment={handleCancelAppointment}
                  onToggleSwapOffer={handleToggleSwapOffer}
                />
              )}

              {/* 👈 חיבור בלוק "התורים שלי" */}
              {currentTab === "my-appts" && (
                <MyAppointments
                  upcomingAppt={upcomingAppointment}
                  historyAppts={appointmentsHistory}
                  onCancelAppointment={handleCancelAppointment}
                  onToggleSwapOffer={handleToggleSwapOffer}
                  onStartBooking={() => setBookingStep("select-service")}
                />
              )}

              {/* תצוגת מסך החלפות */}
              {currentTab === "swaps" && (
                <Swaps
                  myAppointment={upcomingAppointment}
                  onToggleSwapOffer={handleToggleSwapOffer}
                  onRequestSwap={handleRequestSwap}
                  pendingSwapId={pendingSwapId}
                  onSwapChanged={handleSwapChanged}
                />
              )}

              {/* 👈 חיבור בלוק "הודעות" */}
              {currentTab === "messages" && (
                <Messages onAppointmentUpdated={loadAppointments} />
              )}
            </>
          )}

          {/* 👈 חיבור בלוק "פרופיל" */}
          {currentTab === "profile" && (
            <Profile user={user} onLogout={handleLogout} />
          )}

          {/* שלב 2: בחירת שירות */}
          {bookingStep === "select-service" && (
            <SelectService
              onSelectService={handleSelectService}
              onBack={() => setBookingStep("home")}
            />
          )}

          {/* שלב 3: בחירת ספר */}
          {bookingStep === "select-barber" && (
            <SelectBarber
              onSelectBarber={handleSelectBarber}
              onBack={() => setBookingStep("select-service")}
            />
          )}

          {/* 👈 שלב 4: בחירת תאריך ושעה */}
          {bookingStep === "select-datetime" && (
            <SelectDateTime
              onSelectDateTime={handleSelectDateTime}
              onBack={() => setBookingStep("select-barber")}
            />
          )}

          {/* שלב 5: מסך אישור כללי */}
          {bookingStep === "confirm" && (
            <ConfirmScreen
              type="booking"
              title="אישור פרטי תור"
              data={selectedBookingData}
              onConfirm={handleFinalConfirm}
              onBack={() => setBookingStep("select-datetime")}
            />
          )}

          {bookingStep === "success" && (
            <div className="success-screen-container">
              <CheckCircle2 size={80} className="success-icon" />
              <h1 className="success-title">התור נקבע בהצלחה!</h1>
              <p className="success-description">
                נשלח אליך אישור והתראה לפני התור.
              </p>

              <button
                onClick={() => setBookingStep("home")}
                className="cta-button"
              >
                חזור לדף הבית
              </button>
            </div>
          )}

          {/* שלב 6: מסך אישור החלפת תור */}
          {bookingStep === "confirm-swap" && (
            <ConfirmScreen
              type="swap"
              title="אישור בקשת החלפה"
              buttonText="אשר וחכה לאישור 🔄"
              data={selectedBookingData}
              onConfirm={handleConfirmSwapFinal}
              onBack={() => {
                setBookingStep("home");
                setCurrentTab("swaps");
              }}
            />
          )}

          {/* 👈 סרגל ניווט תחתון קבוע – מופיע רק כשאנחנו במסך הבית/בלשוניות */}
          {bookingStep === "home" && (
            <nav className="bottom-nav">
              <button
                className={`nav-item ${currentTab === "home" ? "active" : ""}`}
                onClick={() => setCurrentTab("home")}
              >
                <HomeIcon size={22} />
                <span>בית</span>
              </button>

              <button
                className={`nav-item ${currentTab === "my-appts" ? "active" : ""}`}
                onClick={() => setCurrentTab("my-appts")}
              >
                <Calendar size={22} />
                <span>התורים שלי</span>
              </button>

              <button
                className={`nav-item ${currentTab === "swaps" ? "active" : ""}`}
                onClick={() => setCurrentTab("swaps")}
              >
                <Repeat size={22} />
                <span>החלפות</span>
              </button>

              <button
                className={`nav-item ${currentTab === "messages" ? "active" : ""}`}
                onClick={() => setCurrentTab("messages")}
              >
                <MessageSquare size={22} />
                <span>הודעות</span>
              </button>

              <button
                className={`nav-item ${currentTab === "profile" ? "active" : ""}`}
                onClick={() => setCurrentTab("profile")}
              >
                <User size={22} />
                <span>פרופיל</span>
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
