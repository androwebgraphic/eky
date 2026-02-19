import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';
// import ChatApp from './ChatApp';

// Portal container for search modal
const searchModalRoot = document.getElementById('search-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'search-modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

interface FooterProps {
  onChatClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onChatClick }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  // const [showChatModal, setShowChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Get available locations from localStorage or fallback
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  React.useEffect(() => {
    // Try to get from localStorage (set by DogList or elsewhere)
    const stored = localStorage.getItem('availableLocations');
    if (stored) {
      setAvailableLocations(JSON.parse(stored));
    }
  }, []);

  const handleUserIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated && user) {
      setShowUserModal(true);
    }
  };

  const handleSearchIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSearchModal(true);
  };

  const addToSearchHistory = (term: string) => {
    if (term.trim() && !searchHistory.includes(term.trim())) {
      const newHistory = [term.trim(), ...searchHistory.slice(0, 9)]; // Keep max 10 items
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  };

  const handleSearch = () => {
    // Add search term to history if it exists
    if (searchTerm.trim()) {
      addToSearchHistory(searchTerm.trim());
    }
    // Build search query parameters
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    if (selectedGender) params.append('gender', selectedGender);
    if (selectedSize) params.append('size', selectedSize);
    if (selectedLocation) params.append('location', selectedLocation);
    // Navigate to dogs page with search parameters
    const queryString = params.toString();
    navigate(`/psi${queryString ? `?${queryString}` : ''}`);
    // Close modal and reset form (but keep history)
    setShowSearchModal(false);
    setSearchTerm(''); // Clear input field
    setSelectedGender('');
    setSelectedSize('');
    setSelectedLocation('');
  };

  const handleFilterClick = (filterType: string, value: string) => {
    if (filterType === 'gender') {
      setSelectedGender(selectedGender === value ? '' : value);
    } else if (filterType === 'size') {
      setSelectedSize(selectedSize === value ? '' : value);
    }
  };

  const handleHistoryClick = (historyTerm: string) => {
    setSearchTerm(historyTerm);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
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
            <li title={t('search.placeholder')} onClick={handleSearchIconClick}>
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

      {/* Search Modal */}
      {showSearchModal && ReactDOM.createPortal(
        <div className="footer-search-modal" onClick={() => setShowSearchModal(false)}>
          <div className="footer-search-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="search-modal-header">
              <h2>{t('search.title') || 'Search Dogs'}</h2>
              <button onClick={() => setShowSearchModal(false)} className="search-modal-close" title="Close">×</button>
            </div>

            {/* Search Input */}
            <div className="search-modal-input-group">
              <input
                type="search"
                placeholder={t('search.placeholder') || 'Search for dogs...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                autoFocus
              />
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="search-history-section">
                <div className="search-history-header">
                  <label>{t('search.recentSearches') || 'Recent Searches:'}</label>
                  <button onClick={clearSearchHistory} className="clear-history-btn">Clear</button>
                </div>
                <div className="search-history-tags">
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(term)}
                      className={`search-history-tag ${searchTerm === term ? 'active' : ''}`}
                      title={term}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div className="search-quick-filters">
              <button
                onClick={() => handleFilterClick('gender', 'male')}
                className={`search-filter-btn ${selectedGender === 'male' ? 'active' : ''}`}
              >
                {t('dog.male') || 'Male'}
              </button>
              <button
                onClick={() => handleFilterClick('gender', 'female')}
                className={`search-filter-btn ${selectedGender === 'female' ? 'active' : ''}`}
              >
                {t('dog.female') || 'Female'}
              </button>
              <button
                onClick={() => handleFilterClick('size', 'small')}
                className={`search-filter-btn ${selectedSize === 'small' ? 'active' : ''}`}
              >
                {t('dog.small') || 'Small'}
              </button>
              <button
                onClick={() => handleFilterClick('size', 'large')}
                className={`search-filter-btn ${selectedSize === 'large' ? 'active' : ''}`}
              >
                {t('dog.large') || 'Large'}
              </button>
            </div>

            {/* Location Filter */}
            <div className="search-location-filter">
              <label>{t('search.location') || 'Location'}:</label>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
              >
                <option value="">{t('search.allLocations') || 'All Locations'}</option>
                {availableLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button onClick={handleSearch} className="search-submit-btn">
              {t('button.search') || 'Search'}
            </button>
          </div>
        </div>,
        searchModalRoot
      )}

      {/* Removed <Routes> from Footer to prevent duplicate rendering */}
    </>
  );
};

export default Footer;