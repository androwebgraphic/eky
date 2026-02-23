import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import UserProfileModal from './UserProfileModal';
import NotificationBell from './NotificationBell';
import NewDogsModal from './NewDogsModal';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newDogsCount, setNewDogsCount] = useState(0);
  const [showNewDogsModal, setShowNewDogsModal] = useState(false);
  const [newDogs, setNewDogs] = useState<any[]>([]);
  const timerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Get API URL for profile pictures
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return 'http://172.20.10.2:3001';
  };

  // Fetch new dogs since last visit
  const fetchNewDogs = useCallback(async () => {
    const token = localStorage.getItem('token');
    const apiUrl = getApiUrl();
    
    // Get current user from localStorage to avoid dependency issues
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!currentUser || !currentUser.lastVisit) {
      console.log('[NOTIFICATION] No user or lastVisit found');
      return;
    }

    try {
      const lastVisit = new Date(currentUser.lastVisit).toISOString();
      
      const response = await fetch(`${apiUrl}/api/dogs/new-since/${lastVisit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const dogs = await response.json();
        setNewDogs(dogs);
        setNewDogsCount(dogs.length);
        console.log('[NOTIFICATION] New dogs count:', dogs.length);
      }
    } catch (error) {
      console.error('[NOTIFICATION] Error fetching new dogs:', error);
    }
  }, [getApiUrl]);

  // Update last visit timestamp
  const updateLastVisit = useCallback(async () => {
    if (!user) return;

    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/users/last-visit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[NOTIFICATION] Last visit updated:', data.lastVisit);
        
        // Update user in context
        if (user) {
          updateUser({
            ...user,
            lastVisit: data.lastVisit
          });
        }
      }
    } catch (error) {
      console.error('[NOTIFICATION] Error updating last visit:', error);
    }
  }, [user, getApiUrl, updateUser]);

  // Handle notification bell click
  const handleNotificationClick = () => {
    setShowNewDogsModal(true);
    // Update last visit when user opens notification
    updateLastVisit();
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

  // Start polling for new dogs
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[NOTIFICATION] Starting polling for new dogs');
      // Initial fetch
      fetchNewDogs();
      
      // Poll every 5 minutes
      pollingRef.current = setInterval(() => {
        console.log('[NOTIFICATION] Polling for new dogs...');
        fetchNewDogs();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (pollingRef.current) {
        console.log('[NOTIFICATION] Cleaning up polling interval');
        clearInterval(pollingRef.current);
      }
    };
  }, [isAuthenticated, user?._id]); // Only re-run when auth state or user ID changes

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
              <Link to="statistika" className="header-nav-link-inner">{t('nav.statistics') || 'Statistics'}</Link>
            </nav>
            <div className="header-flex-spacer" />
            {/* Right: Language Selector and User Info */}
            <div className="header-right-inner">
              <LanguageSelector />
              <div className="notification-wrapper">
                <NotificationBell count={newDogsCount} onClick={handleNotificationClick} />
              </div>
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
                  ● {t('userProfile.online')}
                </span>
              </div>

              <div 
                className={`user-dropdown-api ${apiOk === true ? 'ok' : apiOk === false ? 'down' : ''}`}
                title={apiOk === null ? 'Checking API…' : apiOk ? 'API OK' : 'API Down'}
              >
                {apiOk === null ? 'API' : apiOk ? 'API OK' : 'API Down'}{uptime ? ` • ${Math.floor(uptime)}s` : ''}
              </div>

              <p className="user-dropdown-info-item">{t('fields.name')} {user.name}</p>
              <p className="user-dropdown-info-item">{t('fields.email')} {user.email}</p>
              
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
                  ⚙️ {t('button.profile')}
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
              <Link to="statistika" className="header-nav-link-inner">{t('nav.statistics') || 'Statistics'}</Link>
            </nav>
          )}

          {/* Desktop language selector - separate from nav */}
          {!isMobile && (
            <div className="header-right-desktop">
              <LanguageSelector />
            </div>
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
            <Link 
              to="statistika" 
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.statistics') || 'Statistics'}
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

      {/* New Dogs Notification Modal */}
      {showNewDogsModal && (
        <NewDogsModal
          isOpen={showNewDogsModal}
          onClose={() => {
            setShowNewDogsModal(false);
            setNewDogsCount(0);
          }}
          dogs={newDogs}
        />
      )}
    </>
  );
};

export default Header;