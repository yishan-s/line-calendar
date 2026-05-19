import { LogIn } from 'lucide-react';
import './LoginPrompt.css';

export default function LoginPrompt({ onLogin, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-prompt" onClick={e => e.stopPropagation()} id="login-prompt">
        <div className="login-prompt__icon-wrap">
          <LogIn size={28} />
        </div>
        <h2 className="login-prompt__title">Sign in to add events</h2>
        <p className="login-prompt__desc">
          You can browse the calendar freely, but creating events requires a LINE account.
        </p>
        <button className="login-prompt__btn" onClick={onLogin} id="btn-login-prompt">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" width="20" height="20" />
          Continue with LINE
        </button>
        <button className="login-prompt__cancel" onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}