import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import CalendarTab from "./tabs/CalendarTab/CalendarTab";
import ServicesStaffTab from "./tabs/ServicesStaffTab/ServicesStaffTab";
import BroadcastSwapTab from "./tabs/BroadcastSwapTab/BroadcastSwapTab";
import ReportsTab from "./tabs/ReportsTab/ReportsTab";
import ProfileTab from "./tabs/ProfileTab/ProfileTab";
import WeeklyPublishTab from "./tabs/WeeklyPublishTab/WeeklyPublishTab";
import { getMyServicesApi, getMyProvidersApi } from "../services/api";
import { LogOut } from "lucide-react";

const NAV_ITEMS = [
  { key: "calendar", icon: "📅", label: "יומן" },
  { key: "publish", icon: "🗓️", label: "פרסום שבועי" },
  { key: "services", icon: "✂️", label: "שירותים" },
  { key: "broadcast", icon: "📢", label: "הודעות" },
  { key: "reports", icon: "📊", label: "דוחות" },
  { key: "profile", icon: "👤", label: "פרופיל" },
];

// פונקציה ראשית של לוח הבקרה למנהל העסק
export default function AdminDashboard({
  businessName = "מספרת טל",
  onBusinessUpdated,
  onLogout,
}) {
  const [tab, setTab] = useState("calendar");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  // נתונים משותפים שנטענים פעם אחת (אופטימיזציה)
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);

  //תצוג מאזין לשינויי גודל חלון כדי לעדכן את מצב המובייל
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // פונקציה לטעינת נתונים בסיסיים (שירותים וספקים)
  const refreshBaseData = async () => {
    try {
      const [svcData, provData] = await Promise.all([
        getMyServicesApi(),
        getMyProvidersApi(),
      ]);
      setServices(svcData || []);
      setProviders(provData || []);
    } catch (err) {
      console.error("שגיאה בטעינת שירותים/ספרים:", err.message);
    }
  };

  useEffect(() => {
    refreshBaseData();
  }, []);

  return (
    <div dir="rtl" className={`admin-root ${isMobile ? "mobile" : "desktop"}`}>
      {/* Desktop Sidebar (RTL - Right Side) */}
      {!isMobile && (
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <div className="admin-logo">{businessName.slice(0, 1)}</div>
            <div>
              <div className="business-title">{businessName}</div>
              <div className="business-sub">ניהול העסק</div>
            </div>
          </div>
          <nav className="admin-nav-list">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`admin-nav-item ${tab === item.key ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          {onLogout && (
            <div className="admin-nav-item" onClick={onLogout}>
              <span className="nav-icon">
                <LogOut size={18} />
              </span>
              <span>התנתקות</span>
            </div>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <main className="admin-main">
        {isMobile && (
          <header className="mobile-header">
            <div className="admin-logo">{businessName.slice(0, 1)}</div>
            <div className="business-title">{businessName}</div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="mobile-logout-btn"
                title="התנתקות"
                style={{
                  marginRight: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LogOut size={20} />
              </button>
            )}
          </header>
        )}

        {tab === "calendar" && (
          <CalendarTab services={services} providers={providers} />
        )}
        {tab === "publish" && <WeeklyPublishTab providers={providers} />}
        {tab === "services" && (
          <ServicesStaffTab
            services={services}
            providers={providers}
            onUpdate={refreshBaseData}
          />
        )}
        {tab === "broadcast" && <BroadcastSwapTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "profile" && (
          <ProfileTab
            businessName={businessName}
            onBusinessUpdated={onBusinessUpdated}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`mobile-nav-item ${tab === item.key ? "active" : ""}`}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
