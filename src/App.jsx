import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  HomeIcon,
  Calendar,
  Repeat,
  MessageSquare,
  User,
} from "lucide-react";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);

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

  //שומר את התור הקרוב ב-state וב-localStorage
  const [upcomingAppointment, setUpcomingAppointment] = useState(() => {
    try {
      const savedAppt = localStorage.getItem("upcomingAppointment");
      return savedAppt ? JSON.parse(savedAppt) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // בחירת שירות ומעבר לשלב הבא
  const handleSelectService = (service) => {
    setSelectedBookingData((prev) => ({ ...prev, service }));
    setBookingStep("select-barber"); // יעבור למסך בחירת ספר!
    console.log("נבחר שירות:", service);
  };

  // 2. שמירת ספר ומעבר לבחירת תאריך ושעה
  const handleSelectBarber = (barber) => {
    setSelectedBookingData((prev) => ({ ...prev, barber }));
    setBookingStep("select-datetime");
    console.log("נתוני ההזמנה עד כה:", { ...selectedBookingData, barber });
  };

  // 3. שמירת תאריך ושעה ומעבר למסך אישור פרטים
  const handleSelectDateTime = ({ date, time, dayName }) => {
    setSelectedBookingData((prev) => ({ ...prev, date, time, dayName }));
    setBookingStep("confirm"); // מעבר למסך אישור פרטים!
    console.log("נתוני הזמנה מלאים:", {
      ...selectedBookingData,
      date,
      time,
      dayName,
    });
  };

  // 4. טיפול באישור סופי של ההזמנה
  const handleFinalConfirm = (finalData) => {
    console.log("נתוני ההזמנה המלאים שנשלחו:", finalData);
    // בונים את אובייקט התור המעודכן
    const newAppointment = {
      service: finalData.service?.name || "תספורת",
      barber: finalData.barber?.name || "ספר",
      date: finalData.date,
      time: finalData.time,
      imageUrl:
        finalData.barber?.imageUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };

    // שמירה ב-State וב-localStorage
    setUpcomingAppointment(newAppointment);
    localStorage.setItem("upcomingAppointment", JSON.stringify(newAppointment));

    setBookingStep("success");
  };

  // 👈 פונקציה לביטול התור
  const handleCancelAppointment = () => {
    setUpcomingAppointment(null);
    localStorage.removeItem("upcomingAppointment");
  };

  // 👈 פונקציה שמחליפה את מצב ההצעה להחלפה (Toggle)
  const handleToggleSwapOffer = () => {
    if (!upcomingAppointment) return;

    const updatedAppt = {
      ...upcomingAppointment,
      isUpForSwap: !upcomingAppointment.isUpForSwap,
    };

    setUpcomingAppointment(updatedAppt);
    localStorage.setItem("upcomingAppointment", JSON.stringify(updatedAppt));
  };

  // 👈 בקשת החלפת תור מול משתמש אחר
  const handleRequestSwap = (targetAppt) => {
    setSelectedBookingData({
      myAppt: upcomingAppointment,
      targetAppt: targetAppt,
      otherUserName: targetAppt.userName,
      targetId: targetAppt.id,
    });
    setBookingStep("confirm-swap");
  };

  // 👈 2. סיום תהליך אישור ההחלפה
  const handleConfirmSwapFinal = (confirmedData) => {
  // חילוץ ה-targetId שנשמר ב-data
  const targetId = confirmedData?.targetId || confirmedData?.targetAppt?.id;

  if (targetId) {
    setPendingSwapId(targetId);
    localStorage.setItem("pendingSwapId", String(targetId)); // שמירה ב-localStorage
  }

  setBookingStep("home");
  setCurrentTab("swaps");
};

  //פונקציית התנתקות
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div>
      {!user ? (
        <LoginSMS onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
      ) : (
        <>
          {/* תצוגת דף הבית */}
          {bookingStep === "home" && (
            <>
           { currentTab === "home" && (
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
             onCancelAppointment={handleCancelAppointment}
             onToggleSwapOffer={handleToggleSwapOffer}
             onStartBooking={() => setBookingStep("select-service")}
           />
          )}

          {/* תצוגת מסך החלפות */}
          { currentTab === "swaps" && (
            <Swaps
              myAppointment={upcomingAppointment}
              onToggleSwapOffer={handleToggleSwapOffer}
              onRequestSwap={handleRequestSwap}
              pendingSwapId={pendingSwapId ? Number(pendingSwapId) : null}
            />
          )}

          {/* 👈 חיבור בלוק "הודעות" */}
          {currentTab === "messages" && <Messages />}
            </>
            )}

          {/* 👈 חיבור בלוק "פרופיל" */}
          {currentTab === "profile" && (
          <Profile 
           user={user} 
           onLogout={handleLogout} 
             />
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
        </>
      )}
    </div>
  );
}
