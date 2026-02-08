import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import UserProfileModal from './UserProfileModal';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const timerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  // Get API URL for profile pictures
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    return 'http://localhost:3001';
  };

  const checkHealth = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/health`, { method: 'GET' });
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      setApiOk(true);
      setUptime(typeof data.uptime === 'number' ? data.uptime : null);
    } catch (e) {
      setApiOk(false);
      setUptime(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    timerRef.current = window.setInterval(checkHealth, 30000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [checkHealth]);

  // Close expanded panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  // Removed unused variable 'profileImageUrl'
  
  // Calculate dropdown position based on header height
  const dropdownTop = headerRef.current ? `${headerRef.current.offsetHeight}px` : '60px';
  
  return (
    <>
      {isAuthenticated ? (
        <>
        <header
          className="UserHeader"
          style={{
            margin: 0,
            padding: 0,
            top: 0,
            left: 0,
            width: '100vw',
            background: '#75171a',
            color: '#f8f8f8',
            position: 'fixed',
            zIndex: 1000,
            borderTop: '4px solid #75171a',
            minHeight: '60px',
            boxSizing: 'border-box',
          }}
        >
         
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Left: Navigation Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link to="/" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.about')}</Link>
              <Link to="psi" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.dogs')}</Link>
            </nav>
            <div style={{ flex: 1 }} />
            {/* Right: Language Selector and User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LanguageSelector />
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                  <img
                    src={user.profilePicture ? `${getApiUrl()}/u${user.profilePicture.replace('/uploads', '')}` : '../img/androcolored-80x80.jpg'}
                    alt={t('userHeader.avatarAlt')}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', background: '#eee' }}
                    onError={e => { (e.target as HTMLImageElement).src = '../img/androcolored-80x80.jpg'; }}
                  />
                  <span style={{ color: '#f8f8f8', fontWeight: 600, fontSize: 15 }}>{user.username}</span>
                  <span style={{ fontSize: 12, color: '#4CAF50', marginLeft: 2 }}>●</span>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Expanded dropdown panel - outside the header */}
        {isExpanded && user && (
            <div 
              style={{ 
                position: 'fixed',
                top: dropdownTop,
                right: '20px',
                backgroundColor: 'white',
                color: '#333',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '250px',
                zIndex: 9999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                {user.username}
                <span
                  style={{
                    fontSize: '0.8em',
                    color: '#4CAF50',
                    fontWeight: 'normal'
                  }}
                >
                  ● Online
                </span>
              </div>

              <div style={{
                marginBottom: '10px',
                fontSize: '0.8em',
                color: apiOk === null ? '#ffc107' : apiOk ? '#28a745' : '#dc3545'
              }} title={apiOk === null ? 'Checking API…' : apiOk ? 'API OK' : 'API Down'}>
                {apiOk === null ? 'API' : apiOk ? 'API OK' : 'API Down'}{uptime ? ` • ${Math.floor(uptime)}s` : ''}
              </div>

              <p style={{ margin: '5px 0', fontSize: '13px' }}>Name: {user.name}</p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}>Email: {user.email}</p>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(true);
                    setIsExpanded(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="User Menu"
                >
                  ⚙️ Profile
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {t('button.logout') || 'Logout'}
                </button>
              </div>

              {/* Collapse indicator */}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                ▼
              </div>
            </div>
          )}
        </>
      ) : (
         <header style={{
           position: 'fixed',
           top: '0',
           left: '0',
           right: '0',
           minHeight: '7.5rem',
           zIndex: '1000',
           padding: '18px 20px 12px 20px',
           backgroundColor: '#75171a',
           color: '#f8f8f8',
           fontSize: '20px',
           fontWeight: 'bold',
           boxSizing: 'border-box',
           borderBottom: '2px solid #8a2419',
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'center',
           justifyContent: 'flex-start',
         }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {/* Mobile: message above nav */}
            <div
              className="unauth-message-mobile"
              style={{
                width: '100%',
                display: 'none',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <p
                style={{
                  margin: '0 0 0 0',
                  position: 'absolute',
                  top: '3px',
                  fontWeight: 'normal',
                  fontSize: '0.85em',
                  color: 'orange',
                  textAlign: 'center',
                  maxWidth: '500px',
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  whiteSpace: 'normal',
                  display: 'inline-block',
                }}
              >
                Morate biti prijavljeni
              </p>
            </div>
            {/* Desktop: message centered */}
            <div
              className="unauth-message-desktop"
              style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}
            >
              <p
                style={{
                  position: 'absolute',
                  top: '3px',
                  margin: 0,
                  fontWeight: 'normal',
                  fontSize: '0.85em',
                  color: 'orange',
                  textAlign: 'center',
                  maxWidth: '500px',
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  whiteSpace: 'normal',
                  display: 'inline-block',
                }}
              >
                  Morate biti prijavljeni
              </p>
            </div>
            {/* Left side: Navigation Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 1 }}>
              <Link to="/" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.about')}</Link>
              <Link to="psi" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.dogs')}</Link>
              <Link to="logiranje" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.login')}</Link>
              <Link to="registracija" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.register')}</Link>
            </nav>
            {/* Right side: Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 1 }}>
              <LanguageSelector />
            </div>
          </div>
        </header>
      )}
      
      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal 
          isOpen={showProfileModal} 
          onClose={() => {
            setShowProfileModal(false);
          }} 
        />
      )}
    </>
  );
};

export default Header;
