import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import '../sass/partials/_modal-styles.scss'; 

interface NewDogsModalProps {
  dogs: any[];
  onClose: () => void;
}

const NewDogsModal: React.FC<NewDogsModalProps> = ({ dogs, onClose }) => {
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
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // Handle Body Scroll Lock with safety check
  useEffect(() => {
    const isCurrentlyHidden = document.body.style.overflow === 'hidden';
    
    if (!isCurrentlyHidden) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = 'unset';
      }
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (dogs.length === 0) return null;

  // Dynamically set 'active' class to trigger CSS transition/opacity
  const overlayClass = `modal-overlay ${isVisible ? 'active' : ''}`;

  return ReactDOM.createPortal(
    <div className={overlayClass} onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Dogs Found!</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            {/* FIX: Use HTML entity for X instead of SCSS syntax */}
            &#x27;
          </button>
        </div>
        
        <div className="modal-body">
          <p>You have {dogs.length} new dog{dogs.length !== 1 ? 's' : ''} waiting for you:</p>
          
          <div className="dogs-grid">
            {dogs.map(dog => (
              <div key={dog._id} className="dog-card-mini">
                <img 
                  src={dog.thumbnail ? `http://localhost:3001${dog.thumbnail.url}` : '/placeholder-dog.jpg'} 
                  alt={dog.name} 
                  className="dog-thumbnail"
                />
                <div className="dog-info-mini">
                  <h3>{dog.name}</h3>
                  <p>{dog.breed}</p>
                  <p>{dog.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <Link to="/dogs" className="btn btn-primary" onClick={onClose}>
            View All Dogs
          </Link>
        </div>
      </div>,
    document.body
  );
};

export default NewDogsModal;