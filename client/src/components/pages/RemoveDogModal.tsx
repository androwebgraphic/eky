import React from 'react';

interface RemoveDogModalProps {
  dog: any;
  onConfirm: () => void;
  onClose: () => void;
}

const RemoveDogModal: React.FC<RemoveDogModalProps> = ({ dog, onConfirm, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      border: '2px solid #e74c3c',
      borderRadius: 16,
      padding: 32,
      zIndex: 999999,
      minWidth: 320,
      maxWidth: 420,
      boxShadow: '0 2px 16px rgba(0,0,0,0.18)'
    }}>
      <h2 style={{ color: '#e74c3c', marginBottom: 16 }}>Remove Dog</h2>
      <div style={{ marginBottom: 24 }}>
        Are you sure you want to remove <b>{dog.name}</b>?
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
        <button onClick={onClose} style={{ background: '#bbb', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Remove</button>
      </div>
    </div>
  );
};

export default RemoveDogModal;
