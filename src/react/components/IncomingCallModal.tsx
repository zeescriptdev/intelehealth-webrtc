import { AcceptCallIcon, DeclineCallIcon } from '../icons.js';
import type { IncomingCallModalProps } from '../types.js';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const IncomingCallModal = ({
  open,
  callerName,
  patientName,
  openMrsId,
  onAccept,
  onDecline,
}: IncomingCallModalProps) => {
  if (!open) return null;

  return (
    <div className="ihrtc-overlay">
      <div className="ihrtc-modal">
        <button
          type="button"
          onClick={onDecline}
          aria-label="Close"
          className="ihrtc-modal__close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ihrtc-icon-sm"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="ihrtc-modal__head">
          <div className="ihrtc-modal__avatar">{getInitials(callerName)}</div>

          <div className="ihrtc-badge">
            <span className="ihrtc-dot ihrtc-dot--green" />
            Incoming Call
          </div>

          <div>
            <p className="ihrtc-modal__title">{callerName} calling</p>
            <p className="ihrtc-modal__subtitle">
              Patient: <span className="ihrtc-strong">{patientName}</span>
              {openMrsId ? ` · ${openMrsId}` : ''}
            </p>
          </div>
        </div>

        <div className="ihrtc-modal__actions">
          <div className="ihrtc-action">
            <button
              type="button"
              onClick={onDecline}
              className="ihrtc-btn-round ihrtc-btn-round--decline"
            >
              <DeclineCallIcon className="ihrtc-icon" />
            </button>
            <span className="ihrtc-action__label">Decline</span>
          </div>

          <div className="ihrtc-action">
            <button
              type="button"
              onClick={onAccept}
              className="ihrtc-btn-round ihrtc-btn-round--accept"
            >
              <AcceptCallIcon className="ihrtc-icon" />
            </button>
            <span className="ihrtc-action__label">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
