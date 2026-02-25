import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import '../sass/partials/_modal-styles.scss'; 
import { useTranslation } from 'react-i18next';

// Get API URL with proper fallbacks for mobile network access
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL !== undefined && process.env.REACT_APP_API_URL.trim() !== '') {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  if (window.location.protocol === 'https:') {
    return `https://${hostname}`;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  // For IP addresses (including mobile network access)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:3001`;
  }
  // Fallback - use current protocol and hostname
  return `${window.location.protocol}//${hostname}:3001`;
};

// Helper function to convert relative/absolute URLs to absolute URLs
const toAbsUrl = (url?: string) => {
  if (!url) {
    return url;
  }
  const cacheBuster = (window as any).__EKY_IMAGE_CB || ((window as any).__EKY_IMAGE_CB = Date.now());
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const apiBase = process.env.REACT_APP_API_URL || `${protocol}//${hostname}:3001`;
  
  // If already absolute URL, add cache buster and return
  if (/^https?:\/\//.test(url)) {
    return url + (url.includes('?') ? '&' : '?') + 'cb=' + cacheBuster;
  }
  // Handle absolute paths starting with /
  if (url.startsWith('/')) {
    return apiBase + url + '?cb=' + cacheBuster;
  }
  // Handle relative paths
  return apiBase + '/' + url.replace(/^\/+/, '') + '?cb=' + cacheBuster;
};

interface NewDogsModalProps {
  dogs: any[];
  isOpen: boolean;
  onClose: () => void;
}

const NewDogsModal: React.FC<NewDogsModalProps> = ({ dogs, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle visibility for transition/active class
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Handle Body Scroll Lock with safety check
  useEffect(() => {
    if (!isOpen) return;
    
    const isCurrentlyHidden = document.body.style.overflow === 'hidden';
    
    if (!isCurrentlyHidden) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Dynamically set 'active' class to trigger CSS transition/opacity
  const overlayClass = `modal-overlay ${isVisible ? 'active' : ''}`;

    return ReactDOM.createPortal(
    <div className={overlayClass} onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('newDogs.title')}</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label={t('newDogs.close')}
            title={t('newDogs.close')}
            type="button"
          >
            <span>×</span>
          </button>
        </div>
        
        <div className="modal-body">
          {dogs.length === 0 ? (
            <p>{t('newDogs.noNewDogs')}</p>
          ) : (
            <>
              <p>{t('newDogs.waitingForYou', { count: dogs.length })}</p>
              
              <div className="dogs-grid">
                {dogs.map(dog => {
                  // Get the best available image URL (similar to CardSmall)
                  let imgUrl = '/placeholder-dog.jpg';
                  
                  // Try to get the largest image from images array
                  if (dog.images && dog.images.length > 0) {
                    const sortedImages = [...dog.images].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
                    imgUrl = toAbsUrl(sortedImages[0].url);
                  } else if (dog.thumbnail && dog.thumbnail.url) {
                    // Fallback to thumbnail
                    imgUrl = toAbsUrl(dog.thumbnail.url);
                  }
                  
                  return (
                    <div key={dog._id} className="dog-card-mini">
                      <img 
                        src={imgUrl}
                        alt={dog.name} 
                        className="dog-thumbnail"
                        onClick={() => {
                          window.location.href = `/dogs/${dog._id}`;
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-dog.jpg';
                        }}
                      />
                      <div className="dog-info-mini">
                        <h3>{dog.name}</h3>
                        <p className="dog-gender">{dog.gender || ''}</p>
                        <p className="dog-breed">{dog.breed}</p>
                        <p className="dog-location">{dog.location || dog.place}</p>
                      </div>
                      <div className="dog-actions-mini">
                        <Link to={`/dogs/${dog._id}`} className="btn btn-small" onClick={onClose}>
                          {t('newDogs.viewDetails')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {dogs.length > 0 && (
                <div className="modal-footer">
                  <Link to="/dogs" className="btn btn-primary" onClick={onClose}>
                    {t('newDogs.viewAllDogs')}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewDogsModal;