import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

// Portal container for modal
const modalRoot = document.getElementById('removedog-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'removedog-modal-root';
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '100%';
  root.style.height = '100%';
  root.style.zIndex = '2147483647';
  document.body.appendChild(root);
  return root;
})();

interface RemoveDogModalProps {
  dog: any;
  onConfirm: () => void;
  onClose: () => void;
}

const RemoveDogModal: React.FC<RemoveDogModalProps> = ({ dog, onConfirm, onClose }) => {
  // NO LONGER NEEDED - we want background to remain scrollable
  // Modal will stay fixed while background scrolls
  
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      border: '2px solid #e74c3c',
      borderRadius: 16,
      padding: 32,
      zIndex: 2147483647,
      minWidth: 320,
      maxWidth: 420,
      boxShadow: '0 2px 16px rgba(0,0,0,0.18)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: '#e74c3c', margin: 0 }}>Remove Dog</h2>
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
        Are you sure you want to remove <b>{dog.name}</b>?
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
        <button onClick={onClose} style={{ background: '#bbb', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Remove</button>
      </div>
    </div>,
    modalRoot
  );
};

export default RemoveDogModal;
