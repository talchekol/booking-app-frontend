import React from "react";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Star, Users, User } from "lucide-react";
import "./SelectBarber.css";
import { getPublicProvidersApi } from "../../services/api";
import { useTenant } from "../../context/TenantContext";

export default function SelectBarber({ onSelectBarber, onBack }) {
  const { slug } = useTenant();
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoading(true);
        const data = await getPublicProvidersApi(slug);
        setBarbers(data || []);
      } catch (err) {
        console.error("שגיאה בטעינת אנשי צוות:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, [slug]);

  return (
    <div className="select-barber-container">
      {/* 1. כותרת וכפתור חזרה */}
      <div className="screen-header">
        <button onClick={onBack} className="back-btn" title="חזור">
          <ChevronRight size={22} />
        </button>
        <h2 className="screen-title">בחר איש צוות</h2>
        <div className="header-placeholder"></div>
      </div>

      {/* 2. רשימת אנשי הצוות */}
      <div className="barbers-list">
        {loading ? (
          <div className="empty-state">טוען אנשי צוות...</div>
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
                  <span className="barber-subtitle">
                    {barber.description || "איש צוות מקצועי"}
                  </span>
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
