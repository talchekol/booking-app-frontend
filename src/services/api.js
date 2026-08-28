const BASE_URL = "http://localhost:5000"; // הכתובת של שרת ה-Express שלך

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

// 2. ניהול תורים
export const getMyAppointmentsApi = async () => {
  const res = await fetch(`${BASE_URL}/appointments/my`, {
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

// 3. החלפות תורים
export const toggleSwapOfferApi = async (appointmentId) => {
  const res = await fetch(`${BASE_URL}/appointments/swap/toggle`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ appointmentId }),
  });
  return parseResponse(res);
};

// 4. קבלת רשימת תורים זמינים להחלפה
export const fetchAvailableSwapsApi = async () => {
  const res = await fetch(`${BASE_URL}/appointments/swaps/available`, {
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

// שליפת רשימת שירותים (פתוח לכולם - גם ל-SelectService)
export const getPublicServicesApi = async () => {
  const res = await fetch(`${BASE_URL}/business/services`);
  return parseResponse(res);
};

// שליפת רשימת ספרים (פתוח לכולם - גם ל-SelectBarber)
export const getPublicProvidersApi = async () => {
  const res = await fetch(`${BASE_URL}/business/providers`);
  return parseResponse(res);
};

// שליפת יומן תורים של העסק (עם סינון תאריך/ספר)
export const getBusinessAppointmentsApi = async (date, providerId) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (providerId) params.append("providerId", providerId);

  const res = await fetch(
    `${BASE_URL}/business/appointments?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    },
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

// שליפת ימים חסומים ע"י בעל העסק (לצורך הצגה ביומן)
export const getBlockedDaysApi = async (date) => {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `${BASE_URL}/business/blocked-days${date ? `?date=${date}` : ""}`,
    {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    },
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

// שליפת דוחות וסטטיסטיקות (KPIs)
export const getBusinessStatsApi = async () => {
  const res = await fetch(`${BASE_URL}/business/stats`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(res);
};
