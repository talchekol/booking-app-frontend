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
