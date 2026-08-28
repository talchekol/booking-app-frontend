import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Scissors,
  Clock,
  Sparkles,
} from "lucide-react";
import { getPublicServicesApi } from "../../services/api";
import "./SelectService.css";

export default function SelectService({ onSelectService, onBack, businessId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await getPublicServicesApi(businessId);
        // סינון שירות מערכת פנימי של "חסום" אם קיים
        const activeServices = (data || []).filter(
          (s) => !s.name?.startsWith("חסום"),
        );
        setServices(activeServices);
      } catch (err) {
        console.error("שגיאה בטעינת שירותים:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [businessId]);

  return (
    <div className="select-service-container">
      {/* 1. כותרת וכפתור חזרה */}
      <div className="screen-header">
        <button onClick={onBack} className="back-btn" title="חזור">
          <ChevronRight size={22} />
        </button>
        <h2 className="screen-title">בחר שירות</h2>
        <div className="header-placeholder"></div>
      </div>

      {/* 2. רשימת השירותים */}
      <div className="services-list">
        {loading ? (
          <div className="empty-state">טוען שירותים...</div>
        ) : services.length > 0 ? (
          services.map((service) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => onSelectService(service)}
            >
              <div className="service-main-info">
                <div className="service-icon-wrapper">
                  {service.name.includes("משולב") ||
                  service.name.includes("+") ? (
                    <Sparkles size={22} />
                  ) : (
                    <Scissors size={22} />
                  )}
                </div>
                <div className="service-details">
                  <span className="service-title">{service.name}</span>
                  <div className="service-meta">
                    <span className="service-price">₪{service.price}</span>
                    <span>•</span>
                    <span className="service-duration">
                      <Clock size={13} />
                      {service.durationMin || service.duration || 30} דק׳
                    </span>
                  </div>
                </div>
              </div>

              <ChevronLeft size={20} className="arrow-icon" />
            </div>
          ))
        ) : (
          <div className="empty-state">לא נמצאו שירותים זמינים כרגע.</div>
        )}
      </div>
    </div>
  );
}
