import React from 'react';
import { useTranslation } from 'react-i18next';
import './TermsModal.css';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ open, onClose, onAccept }) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
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
    </div>
  );
};

export default TermsModal;
