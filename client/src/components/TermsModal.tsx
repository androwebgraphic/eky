import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './TermsModal.css';

// Portal container for modal
const modalRoot = document.getElementById('terms-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'terms-modal-root';
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '100%';
  root.style.height = '100%';
  root.style.zIndex = '2147483647';
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
    <div className="terms-modal-overlay">
      <div className="terms-modal">
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
