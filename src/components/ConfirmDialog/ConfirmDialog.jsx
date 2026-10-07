import React from "react";
import { AlertTriangle } from "lucide-react";
import "./ConfirmDialog.css";

// מודל אישור אחיד לכל האפליקציה - מחליף את window.confirm() הדיפולטיבי של
// הדפדפן בכל מקום (גם צד לקוח וגם צד ניהול), כדי שיהיה עיצוב עקבי אחד
export default function ConfirmDialog({
  open,
  title = "אישור פעולה",
  message,
  confirmText = "אישור",
  cancelText = "ביטול",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          <AlertTriangle size={22} />
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        {message && <p className="confirm-dialog-message">{message}</p>}
        <div className="confirm-dialog-actions">
          <button onClick={onConfirm} className="confirm-dialog-btn confirm">
            {confirmText}
          </button>
          <button onClick={onCancel} className="confirm-dialog-btn cancel">
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
