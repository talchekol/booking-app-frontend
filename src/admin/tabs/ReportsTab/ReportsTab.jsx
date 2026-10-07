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

  const last7Days = stats?.last7Days || [];
  const maxRevenue = Math.max(1, ...last7Days.map((d) => d.revenue));

  return (
    <div className="tab-pane">
      <h2 className="pane-title">דוחות ו-KPIs</h2>
      <div className="kpis-grid">
        <div className="card-box stat-card">
          <span className="stat-label">תורים היום</span>
          <div className="stat-val stat-primary">{stats?.totalToday ?? 0}</div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">הכנסה צפויה</span>
          <div className="stat-val stat-sky">
            ₪{stats?.expectedRevenueToday ?? 0}
          </div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">הכנסה בפועל</span>
          <div className="stat-val stat-green">
            ₪{stats?.actualRevenueToday ?? 0}
          </div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">ביטולים / הגעות</span>
          <div className="stat-val stat-amber">
            {stats?.cancelledToday ?? 0} / {stats?.completedToday ?? 0}
          </div>
        </div>
        <div className="card-box stat-card">
          <span className="stat-label">סה"כ לקוחות</span>
          <div className="stat-val stat-purple">{stats?.totalClients ?? 0}</div>
        </div>
      </div>

      <div className="card-box" style={{ marginTop: "16px" }}>
        <div className="box-title" style={{ marginBottom: "14px" }}>
          הכנסות - 7 ימים אחרונים
        </div>
        <div className="bar-chart-container">
          {last7Days.map((b, i) => (
            <div key={i} className="bar-column">
              <div
                className={`bar-fill ${b.day === "היום" ? "today" : ""}`}
                style={{ height: `${(b.revenue / maxRevenue) * 100}%` }}
                title={`₪${b.revenue}`}
              />
              <span className="bar-label">{b.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
