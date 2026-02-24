import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import '../sass/partials/_modal-styles.scss'; 

interface NewDogsModalProps {
  dogs: any[];
  isOpen: boolean;
  onClose: () => void;
}

const NewDogsModal: React.FC<NewDogsModalProps> = ({ dogs, isOpen, onClose }) => {
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
          <h2>New Dogs Found!</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close"
            title="Close"
            type="button"
          >
            <span>×</span>
          </button>
        </div>
        
        <div className="modal-body">
          {dogs.length === 0 ? (
            <p>No new dogs since your last visit.</p>
          ) : (
            <>
              <p>You have {dogs.length} new dog{dogs.length !== 1 ? 's' : ''} waiting for you:</p>
              
              <div className="dogs-grid">
                {dogs.map(dog => (
                  <div key={dog._id} className="dog-card-mini">
                    <img 
                      src={dog.thumbnail ? `http://localhost:3001${dog.thumbnail.url}` : '/placeholder-dog.jpg'} 
                      alt={dog.name} 
                      className="dog-thumbnail"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-dog.jpg';
                      }}
                    />
                    <div className="dog-info-mini">
                      <h3>{dog.name}</h3>
                      <p>{dog.breed}</p>
                      <p>{dog.location || dog.place}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {dogs.length > 0 && (
                <div className="modal-footer">
                  <Link to="/dogs" className="btn btn-primary" onClick={onClose}>
                    View All Dogs
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