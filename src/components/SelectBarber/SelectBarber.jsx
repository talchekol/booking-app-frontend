import React from "react";
import { ChevronRight, ChevronLeft, Star, Users } from "lucide-react";
import "./SelectBarber.css";

export default function SelectBarber({ onSelectBarber, onBack }) {
  // נתוני ספרים (בהמשך יגיעו מ-Neon/Prisma)
  const barbers = [
    {
      id: "any",
      name: "כל ספר פנוי",
      title: "התור הקרוב ביותר שזמין",
      isAny: true,
    },
    {
      id: 1,
      name: "דניאל",
      title: "מומחה לתספורות גברים וזקנים",
      rating: 4.9,
      imageUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 2,
      name: "יוסי",
      title: "מומחה לתספורות ילדים ועיצוב",
      rating: 4.8,
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 3,
      name: "אור",
      title: "מומחה לצבע והחלקות",
      rating: 4.7,
      imageUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  ];

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
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="barber-card"
            onClick={() => onSelectBarber(barber)}
          >
            <div className="barber-main-info">
              {/* תמונה או אייקון ל"כל ספר" */}
              <div className="barber-avatar-wrapper">
                {barber.isAny ? (
                  <div className="any-barber-avatar">
                    <Users size={24} />
                  </div>
                ) : (
                  <img
                    src={barber.imageUrl}
                    alt={barber.name}
                    className="barber-avatar"
                  />
                )}
              </div>

              {/* פרטי הספר */}
              <div className="barber-details">
                <span className="barber-name">{barber.name}</span>
                <span className="barber-title">{barber.title}</span>

                {barber.rating && (
                  <div className="barber-rating">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>{barber.rating}</span>
                  </div>
                )}
              </div>
            </div>

            <ChevronLeft size={20} className="arrow-icon" />
          </div>
        ))}
      </div>
    </div>
  );
}
