import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import UserProfileModal from './UserProfileModal';
import NotificationBell from './NotificationBell';
import NewDogsModal from './NewDogsModal';

// Custom Statistics Icon - bar chart matching sharedog-icon style
const StatisticsIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <rect x="3" y="13" width="4" height="8" rx="0.5" fill="currentColor"/>
    <rect x="10" y="8" width="4" height="13" rx="0.5" fill="currentColor"/>
    <rect x="17" y="3" width="4" height="18" rx="0.5" fill="currentColor"/>
  </svg>
);

// Custom Register Icon - person with plus sign matching sharedog-icon style
const RegisterIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <circle cx="12" cy="8" r="4" fill="currentColor"/>
    <path d="M12 14C8.68629 14 6 16.6863 6 20V21H18V20C18 16.6863 15.3137 14 12 14Z" fill="currentColor"/>
    <circle cx="19" cy="5" r="4" fill="currentColor"/>
    <path d="M19 11C15.6863 11 13 13.6863 13 17V18H25V17C25 13.6863 22.3137 11 19 11Z" fill="currentColor"/>
  </svg>
);

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
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
  const [newDogsForModal, setNewDogsForModal] = useState<any[]>([]);
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
    // Store the current new dogs in a separate state for the modal
    setNewDogsForModal([...newDogs]);
    setShowNewDogsModal(true);
    // Don't update lastVisit here - update it when modal closes
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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const mobileMenu = document.querySelector('.authenticated-mobile-menu');
      const hamburgerBtn = document.querySelector('.authenticated-hamburger-btn');
      
      // Close if clicking outside both the menu and hamburger button
      if (mobileMenuOpen && 
          mobileMenu && 
          hamburgerBtn && 
          !mobileMenu.contains(target) && 
          !hamburgerBtn.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

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
            {/* Mobile hamburger menu button */}
            {isMobile && (
              <button 
                className="authenticated-hamburger-btn"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                style={{fontSize: '32px'}}
              >
                <span className="sharedog-icon sharedog-Hamby" style={{fontSize: '32px'}}></span>
              </button>
            )}
            
            {/* Desktop navigation */}
            {!isMobile && (
              <nav className="header-nav-inner">
                <Link to="/" className="header-nav-link-inner">{t('nav.about')}</Link>
                <Link to="psi" className="header-nav-link-inner">{t('nav.dogs')}</Link>
                <Link to="statistika" className="header-nav-link-inner">{t('nav.statistics') || 'Statistics'}</Link>
              </nav>
            )}
            
            <div className="header-flex-spacer" />
            {/* Right: Language Selector, Notifications, and User Info */}
            <div className="header-right-inner">
              <LanguageSelector />
              <div className="notification-wrapper">
                <NotificationBell count={newDogsCount} onClick={handleNotificationClick} />
              </div>
              {user && (
                <div 
                  className="header-user-info-inner"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={e => { 
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
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
                      (e.target as HTMLImageElement).src = '../img/androcolored-80x80.jpg'; 
                    }}
                  />
                  <span className="header-username-inner">{user.username}</span>
                  <span className="header-online-dot">●</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Authenticated mobile menu dropdown */}
        {mobileMenuOpen && isMobile && (
          <nav className="authenticated-mobile-menu">
            <Link to="/" className="authenticated-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="sharedog-icon sharedog-Home" style={{marginRight: '10px', fontSize: '24px'}}></span>
              {t('nav.about')}
            </Link>
            <Link to="psi" className="authenticated-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="sharedog-icon sharedog-Paw" style={{marginRight: '10px', fontSize: '24px'}}></span>
              {t('nav.dogs')}
            </Link>
            <Link to="statistika" className="authenticated-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <StatisticsIcon style={{marginRight: '10px', color: '#f5f5f5', width: '24px', height: '24px'}} />
              {t('nav.statistics') || 'Statistics'}
            </Link>
            <div 
              className="authenticated-mobile-link"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileModal(true);
                setMobileMenuOpen(false);
                setIsExpanded(false);
              }}
              style={{cursor: 'pointer'}}
            >
              <span className="sharedog-icon sharedog-Gear" style={{marginRight: '10px', fontSize: '24px'}}></span>
              {t('button.profile') || 'Profile'}
            </div>
            <div 
              className="authenticated-mobile-link"
              onClick={(e) => {
                e.stopPropagation();
                logout();
                setMobileMenuOpen(false);
              }}
              style={{cursor: 'pointer', color: '#ff6b6b'}}
            >
              <span className="sharedog-icon sharedog-Logout" style={{marginRight: '10px', fontSize: '24px'}}></span>
              {t('button.logout') || 'Logout'}
            </div>
          </nav>
        )}

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
         <header className="header-mobile-container mobile-nav-only">
          {/* Mobile navigation - simple icon bar for unauthenticated users */}
          {isMobile && (
            <nav className="mobile-nav-simple">
              <Link 
                to="/" 
                className="mobile-nav-icon-link" 
                title={t('nav.about')}
              >
                <span className="sharedog-icon sharedog-Home"></span>
              </Link>
              <Link 
                to="logiranje" 
                className="mobile-nav-icon-link" 
                title={t('nav.login')}
              >
                <span className="sharedog-icon sharedog-Login"></span>
              </Link>
              <Link 
                to="registracija" 
                className="mobile-nav-icon-link" 
                title={t('nav.register')}
              >
                <RegisterIcon />
              </Link>
              <div className="mobile-language-indicator">
                <LanguageSelector />
              </div>
            </nav>
          )}

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
        </header>

        {/* Message - show for all non-authenticated users */}
        {!isAuthenticated && (
          <div 
            className="header-message-wrapper"
            style={{
              position: 'fixed',
              top: '62px',
              left: 0,
              right: 0,
              padding: '12px 20px',
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 998,
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <p 
              className="header-message-text"
              style={{
                margin: 0,
                color: '#ff9800',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              {t('nav.mustBeLoggedIn')}
            </p>
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
            setNewDogsForModal([]);
            // Update lastVisit after user has viewed and closed the modal
            updateLastVisit();
          }}
          dogs={newDogsForModal}
        />
      )}
    </>
  );
};

export default Header;