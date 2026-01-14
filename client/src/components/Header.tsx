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
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return `http://172.20.10.2:3001`;
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

  const profileImageUrl = user?.profilePicture ? `${getApiUrl()}${user.profilePicture}` : "../img/androcolored-80x80.jpg";
  
  // Calculate dropdown position based on header height
  const dropdownTop = headerRef.current ? `${headerRef.current.offsetHeight}px` : '60px';
  
  return (
    <>
      {isAuthenticated ? (
        <>
        <header 
          ref={headerRef}
          style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          zIndex: '1000',
          padding: '10px 20px',
          backgroundColor: '#72211f',
          color: '#f5f5f5',
          fontSize: '20px',
          fontWeight: 'bold',
          boxSizing: 'border-box',
          borderBottom: '2px solid #8a2419',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left side: Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.about')}</Link>
            <Link to="psi" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.dogs')}</Link>
          </nav>

          {/* Right side: Language Selector + User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', marginLeft: 'auto' }}>
            <LanguageSelector />
            
            {/* User Picture + Expandable Info */}
            <div 
              style={{ 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={profileImageUrl}
                  alt={t('userHeader.avatarAlt')} 
                  style={{ 
                    width: '35px', 
                    height: '35px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "../img/androcolored-80x80.jpg";
                  }}
                />
                {/* Green online indicator */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '50%',
                    border: '1px solid white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                  title="Online"
                />
              </div>

              {/* Expand/collapse indicator */}
              {!isExpanded && (
                <div style={{ fontSize: '12px', color: '#f5f5f5' }}>
                  ►
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
          zIndex: '1000',
          padding: '10px 20px',
          backgroundColor: '#72211f',
          color: '#f5f5f5',
          fontSize: '20px',
          fontWeight: 'bold',
          boxSizing: 'border-box',
          borderBottom: '2px solid #8a2419',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: 'column'
        }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left side: Navigation Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link to="/" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.about')}</Link>
              <Link to="logiranje" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.login')}</Link>
              <Link to="registracija" style={{ color: '#f5f5f5', textDecoration: 'none', fontSize: '16px' }}>{t('nav.register')}</Link>
            </nav>

            {/* Right side: Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
              <LanguageSelector />
            </div>
          </div>
          <h5 style={{ margin: '10px 0 0 0', fontWeight: 'normal', fontSize: '1em', color: 'orange', textAlign: 'center' }}>
            {t('unauth_subheading')}
          </h5>
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
