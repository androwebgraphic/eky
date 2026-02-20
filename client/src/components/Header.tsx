import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import UserProfileModal from './UserProfileModal';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  // Get API URL for profile pictures
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return 'http://172.20.10.2:3001';
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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu, current state:', mobileMenuOpen);
    setMobileMenuOpen(prev => !prev);
  };

  // Removed unused variable 'profileImageUrl'
  
  // Debug: Log when user changes
  useEffect(() => {
    if (user) {
      console.log('[HEADER DEBUG] User object changed:', {
        username: user.username,
        profilePicture: user.profilePicture,
        _profilePicCacheBuster: user._profilePicCacheBuster
      });
    }
  }, [user]);
  
  // Calculate dropdown position based on header height
  const dropdownTop = headerRef.current ? `${headerRef.current.offsetHeight}px` : '60px';
  
  return (
    <>
      {isAuthenticated ? (
        <>
        <header className="UserHeader">
          <div className="header-content-inner">
            {/* Left: Navigation Links */}
            <nav className="header-nav-inner">
              <Link to="/" className="header-nav-link-inner">{t('nav.about')}</Link>
              <Link to="psi" className="header-nav-link-inner">{t('nav.dogs')}</Link>
            </nav>
            <div className="header-flex-spacer" />
            {/* Right: Language Selector and User Info */}
            <div className="header-right-inner">
              <LanguageSelector />
              {user && (
                <div className="header-user-info-inner" onClick={e => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                  <img
                    key={user._profilePicCacheBuster || 'default'}
                    src={
                      user.profilePicture 
                        ? (() => {
                          let url = user.profilePicture.startsWith('/') ? user.profilePicture : '/' + user.profilePicture;
                          const fullUrl = `${getApiUrl()}${url}`;
                          if (user._profilePicCacheBuster) {
                            // Use cache buster only (no dynamic Date.now())
                            return `${fullUrl}?v=${user._profilePicCacheBuster}`;
                          }
                          return fullUrl;
                        })()
                        : '../img/androcolored-80x80.jpg'
                    }
                    alt={t('userHeader.avatarAlt')}
                    className="header-avatar-inner"
                    onError={e => { 
                      console.error('Failed to load profile picture:', user.profilePicture);
                      (e.target as HTMLImageElement).src = '../img/androcolored-80x80.jpg'; 
                    }}
                    onClick={() => {
                      // Force reload on click
                      const newCacheBuster = Date.now().toString() + '-' + Math.random().toString(36).substring(7);
                      updateUser({
                        ...user,
                        _profilePicCacheBuster: newCacheBuster
                      });
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Tap to refresh"
                  />
                  <span className="header-username-inner">{user.username}</span>
                  <span className="header-online-dot">●</span>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Expanded dropdown panel - outside header */}
        {isExpanded && user && (
            <div 
              className="user-dropdown-panel"
              style={{ top: dropdownTop }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="user-dropdown-header-inner">
                {user.username}
                <span className="user-dropdown-online-text">
                  ● Online
                </span>
              </div>

              <div 
                className={`user-dropdown-api ${apiOk === true ? 'ok' : apiOk === false ? 'down' : ''}`}
                title={apiOk === null ? 'Checking API…' : apiOk ? 'API OK' : 'API Down'}
              >
                {apiOk === null ? 'API' : apiOk ? 'API OK' : 'API Down'}{uptime ? ` • ${Math.floor(uptime)}s` : ''}
              </div>

              <p className="user-dropdown-info-item">Name: {user.name}</p>
              <p className="user-dropdown-info-item">Email: {user.email}</p>
              
              <div className="user-dropdown-buttons">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(true);
                    setIsExpanded(false);
                  }}
                  className="user-dropdown-btn profile"
                  title="User Menu"
                >
                  ⚙️ Profile
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
                  className="user-dropdown-btn logout"
                >
                  {t('button.logout') || 'Logout'}
                </button>
              </div>

              {/* Collapse indicator */}
              <div className="user-dropdown-collapse">
                ▼
              </div>
            </div>
          )}
        </>
      ) : (
         <>
         <header className="header-mobile-container">
          {/* Mobile hamburger menu */}
          {isMobile && (
            <div 
              onClick={toggleMobileMenu}
              className="hamburger-menu-btn"
            >
              ☰
            </div>
          )}

          {/* Message - centered */}
          <div className={`header-message-wrapper ${isMobile ? 'mobile' : 'desktop'}`}>
            <p className="header-message-text">
              {t('nav.mustBeLoggedIn')}
            </p>
          </div>

          {/* Desktop navigation */}
          {!isMobile && (
            <nav className="header-nav-desktop">
              <Link to="/" className="header-nav-link-inner">{t('nav.about')}</Link>
              <Link to="psi" className="header-nav-link-inner">{t('nav.dogs')}</Link>
              <Link to="logiranje" className="header-nav-link-inner">{t('nav.login')}</Link>
              <Link to="registracija" className="header-nav-link-inner">{t('nav.register')}</Link>
              <LanguageSelector />
            </nav>
          )}

          {/* Mobile language selector */}
          {isMobile && (
            <div>
              <LanguageSelector />
            </div>
          )}
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && isMobile && (
          <div className="mobile-menu-dropdown">
            <Link 
              to="/" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link 
              to="psi" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.dogs')}
            </Link>
            <Link 
              to="logiranje" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.login')}
            </Link>
            <Link 
              to="registracija" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.register')}
            </Link>
          </div>
        )}
        </>
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