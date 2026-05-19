"use client";

interface AlertsConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function AlertsConfirmModal({
  open,
  onConfirm,
  onCancel,
  busy = false,
}: AlertsConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="alert-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      onClick={onCancel}
    >
      <div
        className="alert-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="alert-modal-title" className="alert-modal-text">
          Are you sure you want to disable alerts?
        </p>
        <div className="alert-modal-actions">
          <button
            type="button"
            className="btn-terminal"
            onClick={onConfirm}
            disabled={busy}
          >
            [ Y ]
          </button>
          <button
            type="button"
            className="btn-terminal"
            onClick={onCancel}
            disabled={busy}
          >
            [ N ]
          </button>
        </div>
      </div>
    </div>
  );
}
