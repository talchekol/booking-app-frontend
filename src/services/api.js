// כתובת שרת ה-Express - ב-production נקבעת ע"י משתנה הסביבה VITE_API_BASE_URL
// (מוגדר בהגדרות הפריסה ב-Vercel), בפיתוח מקומי נופל חזרה ל-localhost אוטומטית
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// פונקציית עזר לשליפת ה-Token מהאיחסון המקומי
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// פונקציה לעיבוד תגובות ה-API
// פונקציה זו מנסה לקרוא את גוף התגובה כ-JSON. אם התגובה אינה תקינה (res.ok === false), היא זורקת שגיאה עם הודעת השגיאה מהשרת או הודעה כללית.
// אם התגובה תקינה, היא מחזירה את הנתונים שנקראו מהתגובה.
const parseResponse = async (res) => {
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // ייתכן גוף תגובה ריק (למשל בשגיאת שרת לא צפויה)
  }
  if (!res.ok) {
    throw new Error(data.error || "אירעה שגיאת שרת, אנא נסה שוב");
  }
  return data;
};

// 1. אימות ואישור SMS
export const sendSmsCode = async (phone) => {
  const res = await fetch(`${BASE_URL}/auth/send-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  return parseResponse(res);
};

export const verifySmsCode = async (phone, code) => {
  const res = await fetch(`${BASE_URL}/auth/verify-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  return parseResponse(res);
};

// חידוש טוקן (sliding session) - נקרא בשקט ברקע, מאריך את תוקף ההתחברות
// ב-30 יום נוספים מבלי שהמשתמש יצטרך להזין קוד SMS מחדש
export const refreshTokenApi = async () => {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// 2. ניהול תורים
export const getMyAppointmentsApi = async (businessId) => {
  const query = businessId ? `?businessId=${businessId}` : "";
  const res = await fetch(`${BASE_URL}/appointments/my${query}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

export const createNewAppointment = async (bookingData) => {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(bookingData),
  });
  return parseResponse(res);
};

export const cancelAppointmentApi = async (appointmentId) => {
  const res = await fetch(`${BASE_URL}/appointments/${appointmentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// שליפת הגדרות שעות הפעילות של העסק (מבודד לפי slug)
export const getBusinessSettingsApi = async (slug) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/settings`);
  return parseResponse(res);
};

// עדכון הגדרות שעות הפעילות ומרווח התורים (למנהל בלבד)
export const updateBusinessSettingsApi = async (settingsPayload) => {
  const res = await fetch(`${BASE_URL}/business/settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(settingsPayload),
  });
  return parseResponse(res);
};

// 3. החלפות תורים
export const toggleSwapOfferApi = async (appointmentId) => {
  const res = await fetch(`${BASE_URL}/appointments/swap/toggle`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ appointmentId }),
  });
  return parseResponse(res);
};

// 4. קבלת רשימת תורים זמינים להחלפה (מבודד לפי businessId - ה-UUID האמיתי, לא slug,
// כי הנתיב הזה חי תחת /appointments ולא תחת /business/:slug)
export const fetchAvailableSwapsApi = async (businessId) => {
  const params = businessId ? `?businessId=${businessId}` : "";
  const res = await fetch(`${BASE_URL}/appointments/swaps/available${params}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// 5. יצירת בקשת החלפה
export const createSwapRequestApi = async (
  swapOfferId,
  offeredAppointmentId,
) => {
  const res = await fetch(`${BASE_URL}/appointments/swaps/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ swapOfferId, offeredAppointmentId }),
  });
  return parseResponse(res);
};

// 6. ניהול בקשות החלפה אישיות
export const getMySwapRequestsApi = async () => {
  const res = await fetch(`${BASE_URL}/appointments/swaps/requests`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// 7. ניהול בקשות החלפה אישיות
export const approveSwapRequestApi = async (requestId) => {
  const res = await fetch(
    `${BASE_URL}/appointments/swaps/requests/${requestId}/approve`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  return parseResponse(res);
};

// 8. דחיית בקשות החלפה אישיות
export const rejectSwapRequestApi = async (requestId) => {
  const res = await fetch(
    `${BASE_URL}/appointments/swaps/requests/${requestId}/reject`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  return parseResponse(res);
};

// ==========================================
// 4. שירותי ניהול עסק (Admin & Public Data)
// ==========================================

// שליפת שירותים/ספרים של העסק שלי (מזוהה מהטוקן - לשימוש בפאנל הניהול)
export const getMyServicesApi = async () => {
  const res = await fetch(`${BASE_URL}/business/my/services`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

export const getMyProvidersApi = async () => {
  const res = await fetch(`${BASE_URL}/business/my/providers`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

export const getMyAppointmentsAdminApi = async (date, providerId) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (providerId) params.append("providerId", providerId);
  const res = await fetch(
    `${BASE_URL}/business/my/appointments?${params.toString()}`,
    { headers: getAuthHeaders() },
  );
  return parseResponse(res);
};

export const getMyBlockedDaysApi = async (date) => {
  const res = await fetch(
    `${BASE_URL}/business/my/blocked-days${date ? `?date=${date}` : ""}`,
    { headers: getAuthHeaders() },
  );
  return parseResponse(res);
};

export const getMySettingsApi = async () => {
  const res = await fetch(`${BASE_URL}/business/my/settings`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// שוק ההחלפות של העסק שלי (תצוגת מנהל - כל ההצעות, בלי החרגת משתמש)
export const getMySwapOffersApi = async () => {
  const res = await fetch(`${BASE_URL}/business/my/swaps`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// פרסום תורים שבועי - סטטוס: מתי פורסם לאחרונה, ומהו השבוע הקרוב שטרם פורסם
export const getWeekPublishStatusApi = async (today) => {
  const res = await fetch(
    `${BASE_URL}/business/my/week-status${today ? `?today=${today}` : ""}`,
    { headers: getAuthHeaders() },
  );
  return parseResponse(res);
};

// פרסום התורים לשבוע הקרוב שטרם פורסם
export const publishWeekApi = async (today) => {
  const res = await fetch(`${BASE_URL}/business/my/publish-week`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ today }),
  });
  return parseResponse(res);
};

// ביטול פרסום השבוע האחרון שפורסם (מזיז את bookingOpenUntil שבוע אחורה)
export const unpublishWeekApi = async (today) => {
  const res = await fetch(`${BASE_URL}/business/my/unpublish-week`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ today }),
  });
  return parseResponse(res);
};

// שליפת רשימת שירותים (פתוח לכולם - גם ל-SelectService), מבודד לפי slug
export const getPublicServicesApi = async (slug) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/services`);
  return parseResponse(res);
};

// שליפת רשימת ספרים (פתוח לכולם - גם ל-SelectBarber), מבודד לפי slug
export const getPublicProvidersApi = async (slug) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/providers`);
  return parseResponse(res);
};

/// שליפת יומן תורים / שעות תפוסות (פתוח ללקוח לבדיקת זמינות), מבודד לפי slug
export const getBusinessAppointmentsApi = async (slug, date, providerId) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (providerId) params.append("providerId", providerId);

  const res = await fetch(
    `${BASE_URL}/business/${slug}/appointments?${params.toString()}`,
  );
  return parseResponse(res);
};

// עדכון סטטוס תור (מאושר / הושלם / בוטל / לא הגיע)
export const updateAppointmentStatusApi = async (appointmentId, status) => {
  const res = await fetch(
    `${BASE_URL}/business/appointments/${appointmentId}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    },
  );
  return parseResponse(res);
};

// קביעת תור ידני (Walk-in / טלפוני)
export const createManualAppointmentApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/business/appointments/manual`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// חסימת טווח שעות או יום שלם ע"י בעל העסק
export const blockTimeRangeApi = async (payload) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/business/appointments/block`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// שליפת ימי חופש / חסימות יום (פתוח ללקוח), מבודד לפי slug
export const getBlockedDaysApi = async (slug, date) => {
  const res = await fetch(
    `${BASE_URL}/business/${slug}/blocked-days${date ? `?date=${date}` : ""}`,
  );
  return parseResponse(res);
};

// חסימת יום שלם ע"י בעל העסק
export const blockFullDayApi = async (payload) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/business/blocked-days`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// ביטול/מחיקה של יום חסום ע"י בעל העסק
export const unblockFullDayApi = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/business/blocked-days/${id}`, {
    method: "DELETE",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  return parseResponse(res);
};

// ביטול/מחיקה של משבצת שעה חסומה בודדת
export const unblockAppointmentApi = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/business/appointments/block/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return parseResponse(res);
};

// הוספת שירות חדש
export const createServiceApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/business/services`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// מחיקת שירות
export const deleteServiceApi = async (serviceId) => {
  const res = await fetch(`${BASE_URL}/business/services/${serviceId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// הוספת ספר לצוות
export const createProviderApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/business/providers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// מחיקת ספר מהצוות
export const deleteProviderApi = async (providerId) => {
  const res = await fetch(`${BASE_URL}/business/providers/${providerId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// שליפת הודעת מערכת פעילה (למסך הלקוח), מבודד לפי slug
export const getActiveBroadcastApi = async (slug) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/broadcasts/active`);
  return parseResponse(res);
};

// שליפת כל ההודעות (למנהל)
export const getAllBroadcastsApi = async () => {
  const res = await fetch(`${BASE_URL}/business/broadcasts`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// יצירת הודעת מערכת (למנהל)
export const createBroadcastApi = async (message) => {
  const res = await fetch(`${BASE_URL}/business/broadcasts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  return parseResponse(res);
};

// מחיקת הודעת מערכת
export const deleteBroadcastApi = async (id) => {
  const res = await fetch(`${BASE_URL}/business/broadcasts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

//=========================================
// שליפת דוחות וסטטיסטיקות (KPIs)
//=========================================
export const getBusinessStatsApi = async () => {
  const res = await fetch(`${BASE_URL}/business/stats`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// ==========================================
// 5. ניהול פרופיל העסק (Admin & Public Data)
// ==========================================

// שליפת פרטי עסק ציבוריים לפי slug (עבור TenantContext בצד הלקוח - שלב 5)
export const getPublicBusinessProfileApi = async (slug) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/profile`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "שגיאה בשליפת פרטי העסק");
  }
  return res.json();
};

// שליפת פרטי העסק (עבור מסך הניהול - מזוהה לפי הטוקן של המנהל המחובר, לא slug)
export const getBusinessProfileApi = async () => {
  const res = await fetch(`${BASE_URL}/business/my/profile`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "שגיאה בשליפת פרטי העסק");
  }
  return res.json();
};

// בדיקת זמינות slug בלייב (מסך הרשמת עסק חדש)
export const checkSlugAvailabilityApi = async (slug) => {
  const res = await fetch(
    `${BASE_URL}/business/check-slug?slug=${encodeURIComponent(slug)}`,
  );
  return parseResponse(res);
};

// רישום עסק חדש למשתמש מחובר (הופך אותו ל-ADMIN, מחזיר טוקן חדש)
export const registerBusinessApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/business/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// שליפת ביקורות העסק (פתוח לכולם), מבודד לפי slug
export const getBusinessReviewsApi = async (slug) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/reviews`);
  return parseResponse(res);
};

// יצירת ביקורת חדשה (דורש משתמש מחובר)
export const createReviewApi = async (slug, payload) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/reviews`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};

// מחיקת ביקורת (רק הביקורת של המשתמש המחובר עצמו)
export const deleteReviewApi = async (slug, reviewId) => {
  const res = await fetch(`${BASE_URL}/business/${slug}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};

// עדכון פרטי העסק (עבור שמירת הטופס מפאנל הניהול)
export const updateBusinessProfileApi = async (profileData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/business/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "שגיאה בעדכון פרטי העסק");
  }

  return res.json();
};
