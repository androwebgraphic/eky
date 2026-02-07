import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './TermsModal.css';

// Portal container for modal
const modalRoot = document.getElementById('terms-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'terms-modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ open, onClose, onAccept }) => {
  const { t } = useTranslation();
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="terms-modal-overlay" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '85vw', maxWidth: '650px', height: 'auto', maxHeight: '85vh', background: 'rgba(0,0,0,0.5)', borderRadius: 12, zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'auto' }}>
      <div className="terms-modal" style={{ background: '#fff', borderRadius: 12, maxWidth: '600px', width: '95vw', maxHeight: '80vh', overflow: 'auto', position: 'relative', padding: 24 }}>
        <h2>{t('terms_of_use_title')}</h2>
        <div className="terms-modal-content">
          {t('terms_of_use').split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
        <div className="terms-modal-actions">
          <button onClick={onAccept} className="accept-btn">{t('Accept')}</button>
          <button onClick={onClose} className="close-btn">{t('Close')}</button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default TermsModal;
