import React from "react";

function FeedbackDialog({
  open,
  type = "success",
  title,
  message,
  confirmText = "Okay",
  onConfirm,
  onClose,
}) {
  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  let icon = "✓";

  if (type === "error") {
    icon = "!";
  }

  if (type === "warning") {
    icon = "!";
  }

  if (type === "confirm") {
    icon = "?";
  }

  return (
    <div
      className="feedback-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`feedback-dialog feedback-${type}`}
        role="dialog"
        aria-modal="true"
      >

        <button
          type="button"
          className="feedback-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>

        <div className="feedback-icon">
          {icon}
        </div>

        <div className="feedback-content">

          <h3>
            {title}
          </h3>

          <p>
            {message}
          </p>

        </div>

        <div className="feedback-actions">

          <button
            type="button"
            className={
              type === "error"
                ? "feedback-button feedback-error-button"
                : "feedback-button"
            }
            onClick={handleConfirm}
          >
            {confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}

export default FeedbackDialog;