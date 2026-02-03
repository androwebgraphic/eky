
import Header from "./components/Header";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ErrorBoundary from './components/ErrorBoundary';
import ChatApp from './components/ChatApp';
import React, { useState, useEffect } from 'react';
import "./css/mobile-fixes.css"; // Mobile viewport fixes



const App = () => {



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
