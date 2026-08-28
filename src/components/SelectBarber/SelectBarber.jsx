import React from "react";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Star, Users, User } from "lucide-react";
import "./SelectBarber.css";
import { getPublicProvidersApi } from "../../services/api";

export default function SelectBarber({ onSelectBarber, onBack }) {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoading(true);
        const data = await getPublicProvidersApi();
        setBarbers(data || []);
      } catch (err) {
        console.error("שגיאה בטעינת ספרים:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  return (
    <div className="select-barber-container">
      {/* 1. כותרת וכפתור חזרה */}
      <div className="screen-header">
        <button onClick={onBack} className="back-btn" title="חזור">
          <ChevronRight size={22} />
        </button>
        <h2 className="screen-title">בחר ספר</h2>
        <div className="header-placeholder"></div>
      </div>

      {/* 2. רשימת הספרים */}
      <div className="barbers-list">
        {loading ? (
          <div className="empty-state">טוען ספרים...</div>
        ) : barbers.length > 0 ? (
          barbers.map((barber) => (
            <div
              key={barber.id}
              className="barber-card"
              onClick={() => onSelectBarber(barber)}
            >
              <div className="barber-main-info">
                {barber.imageUrl ? (
                  <img
                    src={barber.imageUrl}
                    alt={barber.name}
                    className="barber-avatar"
                  />
                ) : (
                  <div className="barber-avatar-fallback">
                    <User size={24} />
                  </div>
                )}
                <div className="barber-details">
                  <span className="barber-title">{barber.name}</span>
                  <span className="barber-subtitle">ספר מוסמך</span>
                </div>
              </div>

              <ChevronLeft size={20} className="arrow-icon" />
            </div>
          ))
        ) : (
          <div className="empty-state">אין אנשי צוות רשומים כרגע.</div>
        )}
      </div>
    </div>
  );
}
