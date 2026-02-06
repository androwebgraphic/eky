import React, { useEffect, useState } from 'react';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ErrorBoundary from './components/ErrorBoundary';
import ChatApp from './components/ChatApp';
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

  // Global scroll style for html/body/root/main
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('eky-global-scroll-style')) {
      const globalScrollStyle = `
        html, body, #root {
          height: 100% !important;
          min-height: 100% !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        main {
          min-height: 100vh;
          height: auto;
          overflow-y: auto;
        }
      `;
      const style = document.createElement('style');
      style.id = 'eky-global-scroll-style';
      style.innerHTML = globalScrollStyle;
      document.head.appendChild(style);
    }
  }, []);

  // #Wrap scroll style for mobile
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('eky-wrap-scroll-style')) {
      const wrapScrollStyle = `
        #Wrap {
          min-height: 100vh !important;
          height: auto !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin-top: 0 !important;
          margin-bottom: 16px !important;
          box-sizing: border-box !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
      `;
      const style = document.createElement('style');
      style.id = 'eky-wrap-scroll-style';
      style.innerHTML = wrapScrollStyle;
      document.head.appendChild(style);
    }
  }, []);

  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    const handler = () => setShowChatModal(false);
    window.addEventListener('closeChatModal', handler);
    return () => window.removeEventListener('closeChatModal', handler);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <div id="Wrap">
          <Header />
          <Navbar />
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
              <ChatApp />
            </div>
          </div>
        )}
      </ErrorBoundary>
    </>
  );
};

export default App;
