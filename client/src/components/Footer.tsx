import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';
// import ChatApp from './ChatApp';

interface FooterProps {
  onChatClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onChatClick }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);

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
                <span className="sharedog-icon sharedog-Paw" style={{fontSize: '36px'}}></span>
                <span className="desktop-label">{t('footer.dogs')}</span>
              </li>
            </Link>
            <li title={t('button.chat') || 'Chat'} onClick={typeof onChatClick === 'function' ? onChatClick : undefined}>
              <span className="sharedog-icon sharedog-Message" style={{fontSize: '36px'}}></span>
              <span className="desktop-label">{t('footer.chat')}</span>
            </li>
            <Link to="/dodajpsa">
              <li title={t('adddog.title')}>
                <span className="sharedog-icon sharedog-Add-dog" style={{fontSize: '36px'}}>+</span>
                <span className="desktop-label">{t('footer.addDog')}</span>
              </li>
            </Link>
            {isAuthenticated && user ? (
              <li title={`${user.username} - ${t('userProfile.welcome') || 'User Profile'}`} onClick={handleUserIconClick}>
                <span className="sharedog-icon sharedog-User" style={{fontSize: '36px'}}></span>
                <span className="desktop-label">{t('footer.profile')}</span>
              </li>
            ) : (
              <Link to="/logiranje">
                <li title={t('nav.login')}>
                  <span className="sharedog-icon sharedog-User" style={{fontSize: '36px'}}></span>
                  <span className="desktop-label">{t('footer.login')}</span>
                </li>
              </Link>
            )}
            <li 
              title={t('search.placeholder')} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Always navigate to dog list page with search hash
                window.location.href = '/psi#search';
              }}
              style={{ cursor: 'pointer' } as any}
            >
              <span className="sharedog-icon sharedog-Search" style={{fontSize: '36px'}}></span>
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