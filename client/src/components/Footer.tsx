import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';
import { getApiUrl } from '../utils/apiUrl';
// import ChatApp from './ChatApp';

interface FooterProps {
  onChatClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onChatClick }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user, token } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch unread message count
  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      setUnreadCount(0);
      return;
    }
    
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/chat/unread/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    
    fetchUnreadCount();
    
    // Poll for unread count every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user, token]);
  
  // Listen for new messages via custom event
  useEffect(() => {
    const handleNewMessage = () => {
      // Increment unread count temporarily, will be refreshed by poll
      setUnreadCount(prev => prev + 1);
    };
    
    window.addEventListener('chat-message-received', handleNewMessage);
    return () => window.removeEventListener('chat-message-received', handleNewMessage);
  }, []);

  const handleUserIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated && user) {
      setShowUserModal(true);
    }
  };

  return (
    <>
      <footer>
        <nav id="footer-nav">
          <ul>
            <Link to="/psi">
              <li title={t('nav.dogs')}>
                <span className="sharedog-icon sharedog-Paw" style={{fontSize: '50px'}}></span>
                <span className="desktop-label">{t('footer.dogs')}</span>
              </li>
            </Link>
            <li title={t('button.chat') || 'Chat'} onClick={typeof onChatClick === 'function' ? onChatClick : undefined} style={{ position: 'relative' }}>
              <span className="sharedog-icon sharedog-Message" style={{fontSize: '50px'}}></span>
              <span className="desktop-label">{t('footer.chat')}</span>
              {unreadCount > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '0',
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </li>
            <Link to="/dodajpsa">
              <li title={t('adddog.title')}>
                <span className="sharedog-icon sharedog-Add-dog" style={{fontSize: '50px'}}>+</span>
                <span className="desktop-label">{t('footer.addDog')}</span>
              </li>
            </Link>
            {isAuthenticated && user ? (
              <li title={`${user.username} - ${t('userProfile.welcome') || 'User Profile'}`} onClick={handleUserIconClick}>
                <span className="sharedog-icon sharedog-User" style={{fontSize: '50px'}}></span>
                <span className="desktop-label">{t('footer.profile')}</span>
              </li>
            ) : (
              <Link to="/logiranje">
                <li title={t('nav.login')}>
                  <span className="sharedog-icon sharedog-User" style={{fontSize: '50px'}}></span>
                  <span className="desktop-label">{t('footer.login')}</span>
                </li>
              </Link>
            )}
            <li 
              title={t('search.placeholder')} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // If already on /psi page, dispatch custom event to focus search
                if (location.pathname === '/psi') {
                  console.log('[FOOTER SEARCH] Already on /psi page, dispatching focus-search event');
                  window.dispatchEvent(new CustomEvent('focus-search'));
                } else {
                  // Navigate to /psi page with search hash
                  console.log('[FOOTER SEARCH] Navigating to /psi#search');
                  navigate('/psi#search', { replace: false });
                }
              }}
              style={{ cursor: 'pointer' } as any}
            >
              <span className="sharedog-icon sharedog-Search" style={{fontSize: '50px'}}></span>
              <span className="desktop-label">{t('footer.search')}</span>
            </li>
          </ul>
        </nav>
      </footer>

      {/* Chat modal is now rendered globally in App.js */}

      {/* User Profile Modal */}
      {showUserModal && (
        <UserProfileModal 
          isOpen={showUserModal} 
          onClose={() => setShowUserModal(false)} 
        />
      )}
    </>
  );
};

export default Footer;