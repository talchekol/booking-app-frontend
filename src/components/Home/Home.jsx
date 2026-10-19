import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Clock,
  RefreshCw,
  User,
  MapPin,
  Star,
  Plus,
  XCircle,
} from "lucide-react";
import { extractTimeFromIso } from "../../utils/dateUtils";
import {
  getBusinessReviewsApi,
  createReviewApi,
  deleteReviewApi,
} from "../../services/api";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import "./Home.css";

const formatReviewerName = (user) =>
  user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "לקוח";

// --- פונקציות עזר מחוץ ל-JSX ---

const formatApptDate = (dateTimeStr, fallbackDate) => {
  if (
    dateTimeStr &&
    typeof dateTimeStr === "string" &&
    dateTimeStr.includes("T")
  ) {
    const [datePart] = dateTimeStr.split("T");
    const [year, month, day] = datePart.split("-");
    return `${day}/${month}/${year}`;
  }
  return fallbackDate || "";
};

// פונקציה שמקבלת מחרוזת תאריך-שעה בפורמט ISO ומחזירה את השעה בלבד
const formatApptTime = (dateTimeStr, fallbackTime) => {
  if (dateTimeStr) {
    return extractTimeFromIso(dateTimeStr);
  }
  return fallbackTime || "";
};

// פונקציה לבניית קישור WhatsApp תקין מהמספר שהוזן על ידי בעל העסק
//
const buildWhatsappUrl = (rawPhone) => {
  if (!rawPhone) return "";
  const cleaned = rawPhone.replace(/\D/g, "");
  if (!cleaned) return "";
  const formatted = cleaned.startsWith("0")
    ? "972" + cleaned.slice(1)
    : cleaned;
  return `https://wa.me/${formatted}`;
};

export default function Home({
  user,
  businessInfo,
  upcomingAppt,
  onStartBooking,
  onCancelAppointment,
  onToggleSwapOffer,
}) {
  const { showToast } = useToast();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  // נתונים דינמיים לחלוטין מהאינפוטים של בעל העסק
  const address = businessInfo?.address?.trim() || "";
  const phone = businessInfo?.phone?.trim() || "";
  const whatsappUrl = buildWhatsappUrl(businessInfo?.whatsapp);
  const instagramUrl = businessInfo?.instagram?.trim() || "";
  const tiktokUrl = businessInfo?.tiktok?.trim() || "";

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const slug = businessInfo?.slug;

  useEffect(() => {
    if (!slug) return;
    setReviewsLoading(true);
    getBusinessReviewsApi(slug)
      .then((data) => {
        setReviews(
          (data || []).map((r) => ({
            id: r.id,
            userId: r.userId,
            name: formatReviewerName(r.user),
            rating: r.rating,
            comment: r.comment,
          })),
        );
      })
      .catch((err) => console.error("שגיאה בטעינת ביקורות:", err))
      .finally(() => setReviewsLoading(false));
  }, [slug]);

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    if (typeof onCancelAppointment === "function") {
      onCancelAppointment();
    }
  };

  const handleAddReview = async () => {
    if (!newComment.trim() || !slug) return;

    try {
      const saved = await createReviewApi(slug, {
        rating: newRating,
        comment: newComment.trim(),
      });

      setReviews((prev) => [
        {
          id: saved.id,
          userId: saved.userId,
          name: formatReviewerName(saved.user) || formatReviewerName(user),
          rating: saved.rating,
          comment: saved.comment,
        },
        ...prev,
      ]);
      setNewComment("");
      setNewRating(5);
      setShowReviewModal(false);
    } catch (err) {
      console.error("שגיאה בשמירת הביקורת:", err);
      showToast(err.message || "לא הצלחנו לשמור את הביקורת, נסה שוב", "error");
    }
  };

  const handleDeleteReview = (reviewId) => {
    setReviewToDelete(reviewId);
  };

  const handleConfirmDeleteReview = async () => {
    const reviewId = reviewToDelete;
    setReviewToDelete(null);
    if (!slug || !reviewId) return;

    try {
      await deleteReviewApi(slug, reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("שגיאה במחיקת הביקורת:", err);
      showToast(err.message || "לא הצלחנו למחוק את הביקורת, נסה שוב", "error");
    }
  };

  const apptDateDisplay = formatApptDate(
    upcomingAppt?.dateTime,
    upcomingAppt?.date,
  );
  const apptTimeDisplay = formatApptTime(
    upcomingAppt?.dateTime,
    upcomingAppt?.time,
  );

  const hasContactInfo =
    address || phone || whatsappUrl || instagramUrl || tiktokUrl;

  return (
    <div className="home-container">
      {/* 1. בר ברכה עליון */}
      <div className="user-header">
        <div className="greeting-text">
          <h1>שלום {user?.firstName || "אורח"} 👋</h1>
          <p>מה תרצה לקבוע היום?</p>
        </div>
        <div className="user-avatar">
          <User size={24} />
        </div>
      </div>

      {/* 2. כרטיסיית כתובת העסק וניווט - מוצגת רק אם בעל העסק הזין פרטים */}
      {hasContactInfo && (
        <div className="business-location-card">
          <div className="address-header-section">
            <div className="location-icon-bg">
              <MapPin size={24} />
            </div>
            <div className="location-text">
              {/* שם העסק בכותרת בולטת מעל הכתובת */}
              {businessInfo?.name && (
                <h3 className="business-name-header">{businessInfo.name}</h3>
              )}
              {address && (
                <span className="location-address-main">{address}</span>
              )}
            </div>
          </div>

          <div className="location-bottom-row">
            {/* ניווט לפי הכתובת שהוקלדה */}
            {address && (
              <div className="nav-buttons">
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`}
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

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
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
            )}

            {/* ערוצי תקשורת ורשתות חברתיות */}
            <div className="social-bar">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn whatsapp"
                  title="שלח הודעה ב-WhatsApp"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.818 11.818 0 005.71 1.461h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.176-1.237-6.162-3.486-8.411" />
                  </svg>
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="social-btn phone"
                  title="התקשר לעסק"
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </a>
              )}

              {instagramUrl && (
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
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}

              {tiktokUrl && (
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
              )}
            </div>
          </div>
        </div>
      )}

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
              src={
                upcomingAppt.provider?.imageUrl ||
                upcomingAppt.barber?.imageUrl ||
                upcomingAppt.imageUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              }
              alt={upcomingAppt.provider?.name || "איש צוות"}
              className="barber-image"
            />
            <div className="appt-details">
              <span className="service-name">
                {upcomingAppt.service?.name || upcomingAppt.service}
              </span>
              <span className="barber-name">
                עם{" "}
                {upcomingAppt.provider?.name ||
                  upcomingAppt.barber?.name ||
                  upcomingAppt.barber}
              </span>
              <div className="time-badge">
                <Clock size={14} />
                <span>
                  {apptDateDisplay} • {apptTimeDisplay}
                </span>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button
              className="action-btn cancel-btn"
              onClick={() => setShowCancelModal(true)}
            >
              <XCircle size={15} />
              ביטול תור
            </button>
            {upcomingAppt.isUpForSwap ? (
              <button
                className="action-btn cancel-swap-btn"
                onClick={onToggleSwapOffer}
              >
                <XCircle size={15} />
                <span>ביטול החלפה</span>
              </button>
            ) : (
              <button
                className="action-btn swap-btn"
                onClick={onToggleSwapOffer}
              >
                <RefreshCw size={15} />
                <span>הצע להחלפה</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="no-appts">אין לך תורים קרובים כרגע.</p>
      )}

      {/* 5. סקשיין ביקורות */}
      <div className="reviews-section-header">
        <div className="reviews-title-group">
          <h2 className="section-title">מה הלקוחות אומרים ⭐</h2>
          {reviews.length > 0 && (
            <div className="rating-badge-pill">
              <span className="rating-score">
                <Star size={12} fill="#d97706" color="#d97706" />
                {(
                  reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                ).toFixed(1)}
              </span>
              <span className="rating-count">({reviews.length} חוות דעת)</span>
            </div>
          )}
        </div>

        <button
          className="add-review-btn"
          onClick={() => setShowReviewModal(true)}
        >
          <Plus size={15} />
          <span>הוסף ביקורת</span>
        </button>
      </div>

      {reviewsLoading ? (
        <p className="no-appts">טוען ביקורות...</p>
      ) : reviews.length > 0 ? (
        <div className="reviews-scroll">
          {reviews.map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-header">
                <span className="reviewer-name">{rev.name}</span>
                <div className="review-header-actions">
                  <div className="stars-row">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  {rev.userId && rev.userId === user?.id && (
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="review-delete-btn"
                      title="מחק ביקורת"
                    >
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="review-text">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-appts">אין עדיין ביקורות - היו הראשונים לכתוב!</p>
      )}

      {/* מודאל כתיבת ביקורת */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">איך הייתה החוויה שלך? ✂️</h3>
            <p className="modal-description">בחר דירוג ורשום חוות דעת קצרה</p>

            <div className="star-rating-select">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <button
                  key={starIndex}
                  type="button"
                  className="star-btn"
                  onClick={() => setNewRating(starIndex)}
                >
                  <Star
                    size={28}
                    fill={starIndex <= newRating ? "#f59e0b" : "none"}
                    color={starIndex <= newRating ? "#f59e0b" : "#cbd5e1"}
                  />
                </button>
              ))}
            </div>

            <textarea
              placeholder="רשום את חוויית התספורת שלך..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="review-textarea"
            />

            <div className="modal-actions">
              <button
                onClick={handleAddReview}
                className="modal-btn confirm-cancel"
                style={{ backgroundColor: "#6d28d9" }}
                disabled={!newComment.trim()}
              >
                פרסם ביקורת
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="modal-btn dismiss-cancel"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודאל אישור ביטול תור */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">לבטל את התור ?</h3>
            <p className="modal-description">
              התור ב-{apptDateDisplay} בשעה {apptTimeDisplay} יבוטל ולא יופיע
              יותר ביומן שלך.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleConfirmCancel}
                className="modal-btn confirm-cancel"
              >
                כן, ביטול תור
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="modal-btn dismiss-cancel"
              >
                חזור
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!reviewToDelete}
        title="מחיקת ביקורת"
        message="הביקורת שלך תימחק לצמיתות."
        confirmText="כן, מחק"
        cancelText="ביטול"
        onConfirm={handleConfirmDeleteReview}
        onCancel={() => setReviewToDelete(null)}
      />
    </div>
  );
}
