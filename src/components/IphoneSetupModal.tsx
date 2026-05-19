"use client";

interface IphoneSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export function IphoneSetupModal({ open, onClose }: IphoneSetupModalProps) {
  if (!open) return null;

  return (
    <div
      className="alert-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="iphone-setup-title"
      onClick={onClose}
    >
      <div
        className="alert-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="iphone-setup-title" className="alert-modal-title">
          IPHONE SETUP REQUIRED
        </p>
        <p className="alert-modal-text">
          To receive Indy 500 weather alerts on iPhone:
        </p>
        <ol className="alert-modal-steps">
          <li>Open this site in Safari.</li>
          <li>Tap the Share button.</li>
          <li>Tap &ldquo;Add to Home Screen.&rdquo;</li>
          <li>Open &ldquo;Indy 500 Weather&rdquo; from your Home Screen.</li>
          <li>Tap ENABLE PANIC ALERTS again.</li>
        </ol>
        <p className="alert-modal-note">
          iPhone web push only works from the Home Screen app, not a normal
          browser tab.
        </p>
        <div className="alert-modal-actions alert-modal-actions-single">
          <button type="button" className="btn-terminal" onClick={onClose}>
            [ GOT IT ]
          </button>
        </div>
      </div>
    </div>
  );
}
