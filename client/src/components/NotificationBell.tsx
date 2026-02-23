import React from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ count, onClick }) => {
  const { t } = useTranslation();

  return (
    <button 
      className="notification-bell"
      onClick={onClick}
      aria-label={t('notification.ariaLabel') || 'View notifications'}
      title={t('notification.tooltip') || 'New dogs added since your last visit'}
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="notification-bell-icon"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      
      {count > 0 && (
        <span className="notification-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;