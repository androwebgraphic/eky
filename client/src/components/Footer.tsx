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
                <span className="eky-icon eky-eky"></span>
                <span className="desktop-label">{t('footer.dogs')}</span>
              </li>
            </Link>
            <li title={t('button.chat') || 'Chat'} onClick={typeof onChatClick === 'function' ? onChatClick : undefined}>
              <img src="/img/paper-airplane.svg" alt="Chat" className="footer-icon" />
              <span className="desktop-label">{t('footer.chat')}</span>
            </li>
            <Link to="/dodajpsa">
              <li title={t('adddog.title')}>
                <span className="eky-icon eky-add-dog">+</span>
                <span className="desktop-label">{t('footer.addDog')}</span>
              </li>
            </Link>
            {isAuthenticated && user ? (
              <li title={`${user.username} - ${t('userProfile.welcome') || 'User Profile'}`} onClick={handleUserIconClick}>
                <span className="eky-icon eky-user"></span>
                <span className="desktop-label">{t('footer.profile')}</span>
              </li>
            ) : (
              <Link to="/logiranje">
                <li title={t('nav.login')}>
                  <span className="eky-icon eky-user"></span>
                  <span className="desktop-label">{t('footer.login')}</span>
                </li>
              </Link>
            )}
            <li 
              title={t('search.placeholder')} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[FOOTER] Search icon clicked');
                // Always navigate to dog list page with search hash
                window.location.href = '/psi#search';
              }}
              style={{ cursor: 'pointer' } as any}
            >
              <span className="eky-icon eky-search"></span>
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