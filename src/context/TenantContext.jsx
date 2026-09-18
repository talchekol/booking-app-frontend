import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicBusinessProfileApi } from "../services/api";

const TenantContext = createContext(null);

// עוטף את כל אזור הלקוח - קורא slug מה-URL, טוען את פרטי העסק הציבוריים,
// וחושף אותם (כולל business.id, ה-UUID האמיתי שנדרש לחלק מהקריאות) לכל הקומפוננטות שבפנים
export function TenantProvider({ children }) {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBusiness = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getPublicBusinessProfileApi(slug);
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
          setBusiness(null);
        } else {
          setBusiness(data);
        }
      } catch (err) {
        console.error("שגיאה בטעינת פרטי העסק:", err);
        if (!cancelled) {
          setNotFound(true);
          setBusiness(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBusiness();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const value = {
    slug,
    business,
    businessId: business?.id || null,
    loading,
    notFound,
    refreshBusiness: (updated) => setBusiness(updated),
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant חייב לרוץ בתוך TenantProvider");
  }
  return ctx;
}
