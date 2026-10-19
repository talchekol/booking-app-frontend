import React, { useState, useEffect, useRef } from "react";
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
import { useTenant } from "./context/TenantContext";
import { useToast } from "./context/ToastContext";
import {
  getMyAppointmentsApi,
  cancelAppointmentApi,
  toggleSwapOfferApi,
  createNewAppointment,
  createSwapRequestApi,
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

// אזור הלקוח - מקונן תחת /:slug, מקבל את זהות העסק מ-TenantContext
export default function ClientApp({ user, setUser, onLogout }) {
  const { business, businessId, loading: tenantLoading, notFound } = useTenant();
  const { showToast } = useToast();

  // State לניהול מודל התראות (Alert Modal) – פתיחה וסגירה עם כותרת והודעה
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const showAlert = (title, message) => {
    setAlertModal({ isOpen: true, title, message });
  };

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

  // 👈 טעינת התורים מ-Neon בטעינה ראשונה וכשהמשתמש מחובר.
  // בכוונה בלי סינון לפי role: ClientApp תמיד רץ תחת /:slug כצד לקוח - גם
  // משתמש שהוא ADMIN של עסק אחר (או של העסק הזה עצמו) יכול להזמין כאן כלקוח
  // לגיטימי, וחייב לראות את התורים שלו בדיוק כמו כל לקוח אחר.
  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, businessId]);

  // 👈 רענון התורים כשחוזרים לטאב/לחלון - כדי שהצד שקיבל את ההחלפה
  // (ולא ביצע בעצמו פעולה) יראה את השינוי בלי צורך ברענון ידני של הדף
  useEffect(() => {
    if (!user) return;

    const handleFocusRefresh = () => {
      if (document.visibilityState === "visible") {
        loadAppointments();
      }
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
    // businessId בתלויות בכוונה: בלעדיו ה-closure של handleFocusRefresh
    // "נתקע" עם ה-loadAppointments של העסק שהיה פעיל כשהמאזין נרשם לראשונה -
    // אחרי מעבר לעסק אחר (ניווט בתוך ה-SPA, בלי רענון מלא), חזרה לפוקוס/טאב
    // הייתה מריצה מחדש fetch עם ה-businessId הישן ודורסת את הנתונים הנכונים
  }, [user, businessId]);

  // שומר נגד race condition: כשעוברים בין עסקים מהר, יכולות להיות כמה
  // בקשות "באוויר" בו-זמנית (אחת לעסק הישן, אחת לחדש) - אם התשובה הישנה
  // מגיעה אחרי החדשה, היא תדרוס אותה עם נתונים של העסק הלא נכון. הרפרנס
  // הזה מזהה את הבקשה "העדכנית ביותר שנשלחה", ומתעלם מכל תשובה שאינה שלה
  const latestRequestRef = useRef(0);

  const loadAppointments = async () => {
    const requestId = ++latestRequestRef.current;
    setLoadingAppts(true);
    try {
      const data = await getMyAppointmentsApi(businessId);
      if (requestId !== latestRequestRef.current) return; // בקשה ישנה - מתעלמים
      // השרת מחזיר אובייקט עם upcoming ו-history, מסונן לעסק הנוכחי בלבד
      // (businessId מועבר כפרמטר) - כדי שתור קרוב יותר אצל עסק אחר לא "ידחוק"
      // בתצוגה את התור של המשתמש בעסק שבו הוא נמצא כרגע
      setUpcomingAppointment(data.upcoming || null);
      setAppointmentsHistory(data.history || []);
    } catch (err) {
      console.error("שגיאה בטעינת תורים מהשרת:", err);
    } finally {
      if (requestId === latestRequestRef.current) setLoadingAppts(false);
    }
  };

  // בחירת שירות ומעבר לשלב הבא
  const handleSelectService = (service) => {
    setSelectedBookingData((prev) => ({ ...prev, service }));
    setBookingStep("select-barber");
  };

  // 2. שמירת איש צוות ומעבר לבחירת תאריך ושעה
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
      // הרכבת מחרוזת ישירה ששומרת על השעה המדויקת ללא הסטת אזור זמן
      const dateTimeUtc = `${finalData.date}T${finalData.time}:00.000Z`;

      const appointmentPayload = {
        businessId,
        providerId: selectedBookingData.barber?.id,
        serviceId: selectedBookingData.service?.id,
        dateTime: dateTimeUtc,
      };

      // שליחה אסינכרונית ל-Node.js -> PostgreSQL
      await createNewAppointment(appointmentPayload);

      // רענון התור הקרוב וההיסטוריה בלייב מ-Neon
      await loadAppointments();

      // מעבר למסך ההצלחה
      setBookingStep("success");
    } catch (err) {
      console.error("שגיאה בקביעת התור:", err);
      showAlert(
        "לא ניתן לקבוע תור",
        err.message || "כבר קיים לך תור עתידי במערכת או שהשעה נתפסה.",
      );
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
        showToast(err.message || "אירעה שגיאה בביטול התור, אנא נסה שוב", "error");
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
        showToast(err.message || "אירעה שגיאה בעדכון הצעת ההחלפה, אנא נסה שוב", "error");
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
        showToast(err.message || "אירעה שגיאה בשליחת בקשת ההחלפה, אנא נסה שוב", "error");
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

  // מצב טעינה ראשוני של פרטי העסק לפי ה-slug
  if (tenantLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>טוען...</div>
    );
  }

  // ה-slug בכתובת לא תואם לשום עסק קיים
  if (notFound) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>העסק המבוקש לא נמצא</h2>
        <p>ייתכן שהקישור שגוי או שהעסק כבר לא פעיל.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginSMS
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
        businessLogoUrl={business?.logoUrl}
      />
    );
  }

  return (
    <div>
      <div className="client-mobile-wrapper">
        {bookingStep === "home" && (
          <>
            {currentTab === "home" && (
              <Home
                user={user}
                businessInfo={business}
                upcomingAppt={upcomingAppointment}
                onStartBooking={() => setBookingStep("select-service")}
                onCancelAppointment={handleCancelAppointment}
                onToggleSwapOffer={handleToggleSwapOffer}
              />
            )}

            {currentTab === "my-appts" && (
              <MyAppointments
                upcomingAppt={upcomingAppointment}
                historyAppts={appointmentsHistory}
                onCancelAppointment={handleCancelAppointment}
                onToggleSwapOffer={handleToggleSwapOffer}
                onStartBooking={() => setBookingStep("select-service")}
              />
            )}

            {currentTab === "swaps" && (
              <Swaps
                myAppointment={upcomingAppointment}
                onToggleSwapOffer={handleToggleSwapOffer}
                onRequestSwap={handleRequestSwap}
                pendingSwapId={pendingSwapId}
                onSwapChanged={handleSwapChanged}
              />
            )}

            {currentTab === "messages" && (
              <Messages onAppointmentUpdated={loadAppointments} />
            )}
          </>
        )}

        {currentTab === "profile" && (
          <Profile user={user} onLogout={onLogout} />
        )}

        {bookingStep === "select-service" && (
          <SelectService
            onSelectService={handleSelectService}
            onBack={() => setBookingStep("home")}
          />
        )}

        {bookingStep === "select-barber" && (
          <SelectBarber
            onSelectBarber={handleSelectBarber}
            onBack={() => setBookingStep("select-service")}
          />
        )}

        {bookingStep === "select-datetime" && (
          <SelectDateTime
            selectedBarber={selectedBookingData.barber}
            onSelectDateTime={handleSelectDateTime}
            onBack={() => setBookingStep("select-barber")}
          />
        )}

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

            <button
              onClick={() => setBookingStep("home")}
              className="cta-button"
            >
              חזור לדף הבית
            </button>
          </div>
        )}

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

      {alertModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon-header">⚠️</div>
            <h3 className="modal-title">{alertModal.title}</h3>
            <p className="modal-description">{alertModal.message}</p>
            <div className="modal-actions">
              <button
                onClick={() =>
                  setAlertModal({ isOpen: false, title: "", message: "" })
                }
                className="cta-button"
                style={{ width: "100%", marginTop: "10px" }}
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
