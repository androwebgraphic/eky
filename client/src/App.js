import React, { useEffect, useState } from 'react';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ErrorBoundary from './components/ErrorBoundary';
import ChatApp from './components/ChatApp';
import { MapModalProvider } from './contexts/MapModalContext';
import "./css/mobile-fixes.css"; // Mobile viewport fixes

const App = () => {
  // CRITICAL: Fix input fields being non-editable due to global user-select: none
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('eky-input-fix-style')) {
      const inputFixStyle = `
        input, textarea, select, [contenteditable="true"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
          pointer-events: auto !important;
          caret-color: #333 !important;
        }
      `;
      const style = document.createElement('style');
      style.id = 'eky-input-fix-style';
      style.innerHTML = inputFixStyle;
      document.head.appendChild(style);
    }
  }, []);

  // Removed global scroll styles - let CSS handle everything


  const [showChatModal, setShowChatModal] = useState(false);
  const [adoptionConvoUserId, setAdoptionConvoUserId] = useState(null);

  useEffect(() => {
    const closeHandler = () => {
      setShowChatModal(false);
      setAdoptionConvoUserId(null);
    };
    const openHandler = (e) => {
      setShowChatModal(true);
      if (e.detail && e.detail.userId) {
        setAdoptionConvoUserId(e.detail.userId);
      }
    };
    
    window.addEventListener('closeChatModal', closeHandler);
    window.addEventListener('openChatModal', openHandler);
    
    return () => {
      window.removeEventListener('closeChatModal', closeHandler);
      window.removeEventListener('openChatModal', openHandler);
    };
  }, []);

  return (
    <MapModalProvider>
      <ErrorBoundary>
        <div id="Wrap">
          <Header />
          <main>
            <Navbar />
          </main>
          <Footer onChatClick={() => setShowChatModal(true)} />
        </div>
        {showChatModal && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10010,
            boxShadow: '0 4px 24px rgba(33,150,243,0.18)',
            borderRadius: 16,
          }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 0, minWidth: 260, maxWidth: 340, position: 'relative' }} onClick={e => e.stopPropagation()}>
              <ChatApp adoptionConvoUserId={adoptionConvoUserId} />
            </div>
          </div>
        )}
      </ErrorBoundary>
    </MapModalProvider>
  );
};

export default App;