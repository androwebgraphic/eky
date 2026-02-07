import React from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';

// Portal container for modal
const modalRoot = document.getElementById('removedog-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'removedog-modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

interface RemoveDogModalProps {
  dog: any;
  onConfirm: () => void;
  onClose: () => void;
}

const RemoveDogModal: React.FC<RemoveDogModalProps> = ({ dog, onConfirm, onClose }) => {
  const { t } = useTranslation();
  // NO LONGER NEEDED - we want background to remain scrollable
  // Modal will stay fixed while background scrolls
  
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '85vw',
      maxWidth: '400px',
      height: 'auto',
      background: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      zIndex: 2147483647,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      pointerEvents: 'auto'
    }}>
      <div style={{
        background: '#fafafa',
        padding: 32,
        borderRadius: 16,
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#e74c3c', margin: 0 }}>{t('removeDog.title')}</h2>
        <button
          onClick={onClose}
          style={{
            width: 22,
            height: 22,
            background: '#e74c3c',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer',
            marginLeft: 12,
            boxShadow: '0 2px 8px rgba(231,76,60,0.10)',
          }}
          aria-label="Close"
          title="Close"
        >
          <span style={{
            color: '#fff',
            fontSize: '2rem',
            fontWeight: 900,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>×</span>
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        {t('removeDog.confirm', { name: dog.name })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
        <button onClick={onClose} style={{ background: '#bbb', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>{t('removeDog.cancel')}</button>
        <button onClick={onConfirm} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>{t('removeDog.remove')}</button>
      </div>
      </div>
    </div>,
    modalRoot
  );
};

export default RemoveDogModal;
