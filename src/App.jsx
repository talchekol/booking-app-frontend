import React, { useState, useEffect } from "react";
import LoginSMS from "./components/LoginSMS/LoginSMS";
import Home from "./components/Home/Home";
import SelectService from "./components/SelectService/SelectService";
import SelectBarber from "./components/SelectBarber/SelectBarber";
import SelectDateTime from "./components/SelectDateTime/SelectDateTime";
import ConfirmScreen from "./components/ConfirmScreen/ConfirmScreen";
import { CheckCircle2 } from "lucide-react";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);

  // ניהול השלב הנוכחי בתהליך קביעת התור
  // 'home' | 'select-service' | 'select-barber' | 'select-datetime' | 'confirm'
  const [bookingStep, setBookingStep] = useState("home");
  const [selectedBookingData, setSelectedBookingData] = useState({});
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);

  // בדיקה בזמן טעינת הדף אם המשתמש כבר מחובר
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
          {/* שלב 1: דף הבית */}
          {bookingStep === "home" && (
            <Home
              user={user}
              onStartBooking={() => setBookingStep("select-service")}
              upcomingAppt={upcomingAppointment}
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
        </>
      )}
    </div>
  );
}
