import React from "react";
import {
  Calendar,
  PlusCircle,
  Clock,
  RefreshCw,
  Home as HomeIcon,
  User,
  MessageSquare,
  Repeat,
  MapPin,
  Star,
  Navigation,
} from "lucide-react";
import "./Home.css";

export default function Home({ user, upcomingAppt, onStartBooking }) {
  const businessAddress = "הרצל 45, תל אביב";

  // הקישורים לרשתות החברתיות (בהמשך יגיעו מה-DB)
  const instagramUrl = "https://instagram.com";
  const tiktokUrl = "https://tiktok.com";

  // נתוני דמו לביקורות
  const reviews = [
    {
      id: 1,
      name: "אורן לוי",
      rating: 5,
      comment: "ספר אלוף! מדויק ברמות ויחס זהב.",
    },
    {
      id: 2,
      name: "מאור כהן",
      rating: 5,
      comment: "האפליקציה ממש נוחה והתספורת יצאה אש.",
    },
    {
      id: 3,
      name: "רועי מזרחי",
      rating: 5,
      comment: "תמיד מגיע בזמן, מקום נקי ומזמין.",
    },
  ];

  return (
    <div className="home-container">
      {/* 1. בר ברכה עליון */}
      <div className="user-header">
        <div className="greeting-text">
          <h1>שלום {user?.firstName || "יוסי"} 👋</h1>
          <p>מה תרצה לקבוע היום?</p>
        </div>
        <div className="user-avatar">
          <User size={24} />
        </div>
      </div>

      {/* 2. כרטיסיית כתובת העסק וניווט מהיר */}
      <div className="business-location-card">
        {/* חלק עליון: כתובת העסק בולטת */}
        <div className="address-header-section">
          <div className="location-icon-bg">
            <MapPin size={24} />
          </div>
          <div className="location-text">
            <span className="location-label">כתובת העסק</span>
            <span className="location-address-main">{businessAddress}</span>
          </div>
        </div>

        {/* שורה תחתונה: כפתורי ניווט (Waze/Maps) בצד אחד, סושיאל בצד השני */}
        <div className="location-bottom-row">
          {/* לוגואים של Waze ו-Google Maps */}
          <div className="nav-buttons">
            {/* Waze - לוגו רשמי מדויק */}
            <a
              href={`https://waze.com/ul?q=${encodeURIComponent(businessAddress)}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-app-btn"
              title="נווט עם Waze"
            >
              <svg width="22" height="22" viewBox="0 0 512 512">
                <path
                  fill="#333333"
                  d="M380.8 193.3c0-82.6-67-149.6-149.6-149.6S81.6 110.7 81.6 193.3c0 37.1 13.5 71 36 97.2l-14 36c-2.4 6.2 3.1 12.3 9.6 10.7l37.2-9.1c24 15.6 52.7 24.8 83.6 24.8 82.6 0 149.6-67 149.6-149.6z"
                />
                <circle cx="180" cy="180" r="20" fill="#ffffff" />
                <circle cx="284" cy="180" r="20" fill="#ffffff" />
                <path
                  fill="#ffffff"
                  d="M180 230c15 20 50 20 65 0"
                  stroke="#333333"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </svg>
            </a>

            {/* Google Maps Logo */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-app-btn"
              title="נווט עם Google Maps"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                />
                <circle fill="#FFFFFF" cx="12" cy="9" r="2.5" />
              </svg>
            </a>
          </div>

          {/* רשתות חברתיות */}
          <div className="social-bar">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn instagram"
              title="אינסטגרם"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn tiktok"
              title="טיקטוק"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V5.8a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 1 0 15.8 12V8.3a8.2 8.2 0 0 0 4.79 1.54V6.4a4.85 4.85 0 0 1-1-.01z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* 3. כפתור מרכזי לקביעת תור */}
      <button onClick={onStartBooking} className="cta-button">
        <PlusCircle size={22} />
        קבע תור חדש
      </button>

      {/* 4. סקשיין תורים קרובים */}
      <div className="section-header">
        <h2 className="section-title">התורים הקרובים שלי</h2>
      </div>

      {upcomingAppt ? (
        <div className="appointment-card">
          <div className="card-body">
            <img
              src={upcomingAppt.imageUrl}
              alt={upcomingAppt.barber}
              className="barber-image"
            />
            <div className="appt-details">
              <span className="service-name">{upcomingAppt.service}</span>
              <span className="barber-name">עם {upcomingAppt.barber}</span>
              <div className="time-badge">
                <Clock size={14} />
                <span>
                  {upcomingAppt.date} • {upcomingAppt.time}
                </span>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button className="action-btn">צפה בפרטים</button>
            <button className="action-btn swap-btn">
              <RefreshCw size={15} />
              הצע להחלפה
            </button>
          </div>
        </div>
      ) : (
        <p className="no-appts">אין לך תורים קרובים כרגע.</p>
      )}

      {/* 5. סקשיין ביקורות ודירוג עסק */}
      <div className="section-header">
        <h2 className="section-title">מה הלקוחות אומרים</h2>
        <div className="rating-badge">
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span>4.9 (128 ביקורות)</span>
        </div>
      </div>

      <div className="reviews-scroll">
        {reviews.map((rev) => (
          <div key={rev.id} className="review-card">
            <div className="review-header">
              <span className="reviewer-name">{rev.name}</span>
              <div className="stars-row">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
            </div>
            <p className="review-text">"{rev.comment}"</p>
          </div>
        ))}
      </div>

      {/* 6. סרגל ניווט תחתון (Bottom Bar) */}
      <nav className="bottom-nav">
        <button className="nav-item active">
          <HomeIcon size={22} />
          <span>בית</span>
        </button>
        <button className="nav-item">
          <Calendar size={22} />
          <span>התורים שלי</span>
        </button>
        <button className="nav-item">
          <Repeat size={22} />
          <span>החלפות</span>
        </button>
        <button className="nav-item">
          <MessageSquare size={22} />
          <span>הודעות</span>
        </button>
        <button className="nav-item">
          <User size={22} />
          <span>פרופיל</span>
        </button>
      </nav>
    </div>
  );
}
