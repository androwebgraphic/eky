import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './TermsModal.css';

// Portal container for modal
const modalRoot = document.getElementById('terms-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'terms-modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '100%';
  root.style.height = '100%';
  root.style.zIndex = '2147483647';
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
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!open) return null;
  
  return ReactDOM.createPortal(
    <div className="terms-modal-overlay" data-mobile={isMobile}>
      <div className="terms-modal" data-mobile={isMobile}>
        <h2>{t('terms_of_use_title')}</h2>
        <div className="terms-modal-content" data-mobile={isMobile}>
          {t('terms_of_use').split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
        <div className="terms-modal-actions" data-mobile={isMobile}>
          <button onClick={onAccept} className="accept-btn" data-mobile={isMobile}>
            {t('Accept')}
          </button>
          <button onClick={onClose} className="close-btn" data-mobile={isMobile}>
            {t('Close')}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default TermsModal;
