import React from "react";
import {
  ChevronRight,
  ChevronLeft,
  Scissors,
  Clock,
  Sparkles,
} from "lucide-react";
import "./SelectService.css";

export default function SelectService({ onSelectService, onBack }) {
  // נתוני שירותים לדוגמה (בהמשך יגיעו מה-DB מתוך טבלת Service)
  const services = [
    {
      id: 1,
      name: "תספורת גברים",
      duration: "30 דק׳",
      price: "₪80",
      category: "haircut",
    },
    {
      id: 2,
      name: "עיצוב זקן",
      duration: "20 דק׳",
      price: "₪40",
      category: "beard",
    },
    {
      id: 3,
      name: "תספורת + זקן (משולב)",
      duration: "45 דק׳",
      price: "₪110",
      category: "combo",
    },
    {
      id: 4,
      name: "תספורת ילדים",
      duration: "25 דק׳",
      price: "₪60",
      category: "kids",
    },
    {
      id: 5,
      name: "צבע לשיער / גוונים",
      duration: "60 דק׳",
      price: "₪250",
      category: "color",
    },
  ];

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
        {services.map((service) => (
          <div
            key={service.id}
            className="service-card"
            onClick={() => onSelectService(service)}
          >
            <div className="service-main-info">
              <div className="service-icon-wrapper">
                {service.category === "combo" ? (
                  <Sparkles size={22} />
                ) : (
                  <Scissors size={22} />
                )}
              </div>
              <div className="service-details">
                <span className="service-title">{service.name}</span>
                <div className="service-meta">
                  <span className="service-price">{service.price}</span>
                  <span>•</span>
                  <span className="service-duration">
                    <Clock size={13} />
                    {service.duration}
                  </span>
                </div>
              </div>
            </div>

            <ChevronLeft size={20} className="arrow-icon" />
          </div>
        ))}
      </div>
    </div>
  );
}
