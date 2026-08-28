import React, { useState, useEffect } from "react";
import "./ReportsTab.css";
import { getBusinessStatsApi } from "../../../services/api";

//דוחות ו-KPIs
export default function ReportsTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getBusinessStatsApi()
      .then(setStats)
      .catch((err) => console.error("שגיאה בטעינת נתונים:", err));
  }, []);

  return (
    <div className="tab-pane">
      <h2 className="pane-title">דוחות ו-KPIs</h2>
      <div className="kpis-grid">
        <div className="card-box stat-card">
          <span className="stat-label">תורים היום</span>
          <div className="stat-val stat-primary">{stats?.totalToday || 6}</div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">הכנסה צפויה</span>
          <div className="stat-val stat-sky">
            ₪{stats?.expectedRevenueToday || 380}
          </div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">הכנסה בפועל</span>
          <div className="stat-val stat-green">₪240</div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">ביטולים / הגעות</span>
          <div className="stat-val stat-amber">
            {stats?.cancelledToday || 2} / {stats?.completedToday || 2}
          </div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">סה"כ לקוחות רשומים</span>
          <div className="stat-val stat-purple">
            {stats?.totalClients || 184}
          </div>
        </div>
      </div>

      <div className="card-box" style={{ marginTop: "16px" }}>
        <div className="box-title" style={{ marginBottom: "14px" }}>
          הכנסות - 7 ימים אחרונים
        </div>
        <div className="bar-chart-container">
          {[
            { day: "ו", val: 420 },
            { day: "ש", val: 610 },
            { day: "א", val: 180 },
            { day: "ב", val: 60 },
            { day: "ג", val: 540 },
            { day: "ד", val: 390 },
            { day: "היום", val: 300, isToday: true },
          ].map((b, i) => (
            <div key={i} className="bar-column">
              <div
                className={`bar-fill ${b.isToday ? "today" : ""}`}
                style={{ height: `${(b.val / 610) * 100}%` }}
              />
              <span className="bar-label">{b.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
