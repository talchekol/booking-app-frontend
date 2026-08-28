import React, { useState } from "react";
import "./ProfileTab.css";

export default function ProfileTab({ businessName }) {
  const [profile, setProfile] = useState({
    businessName: businessName,
    address: "הרצל 45, תל אביב",
    phone: "050-1234567",
    whatsapp: "https://wa.me/972501234567",
    instagram: "https://instagram.com/mysalon",
    tiktok: "https://tiktok.com/@mysalon",
  });

  return (
    <div className="tab-pane">
      <h2 className="pane-title">פרופיל העסק</h2>
      <div className="card-box" style={{ maxWidth: "520px" }}>
        <div className="profile-form-grid">
          <div>
            <label className="field-label">שם העסק</label>
            <input
              value={profile.businessName}
              onChange={(e) =>
                setProfile({ ...profile, businessName: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="field-label">כתובת העסק</label>
            <input
              value={profile.address}
              onChange={(e) =>
                setProfile({ ...profile, address: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="field-label">מספר טלפון</label>
            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="field-label">קישור לוואטסאפ</label>
            <input
              value={profile.whatsapp}
              onChange={(e) =>
                setProfile({ ...profile, whatsapp: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="field-label">קישור לאינסטגרם</label>
            <input
              value={profile.instagram}
              onChange={(e) =>
                setProfile({ ...profile, instagram: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div>
            <label className="field-label">קישור לטיקטוק</label>
            <input
              value={profile.tiktok}
              onChange={(e) =>
                setProfile({ ...profile, tiktok: e.target.value })
              }
              className="admin-input"
            />
          </div>
        </div>
        <div className="profile-note">
          השינויים נשמרים אוטומטית ומשתקפים מיידית במסך הלקוח.
        </div>
      </div>
    </div>
  );
}
