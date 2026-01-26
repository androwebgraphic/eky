import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';
// import ChatApp from './ChatApp';

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
            <Link to="psi">
              <li title={t('nav.dogs')}>
                <span className="eky-icon eky-eky"></span>
              </li>
            </Link>
            <li title={t('button.chat') || 'Chat'} onClick={typeof onChatClick === 'function' ? onChatClick : undefined} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
              <img src="/img/paper-airplane.svg" alt="Chat" style={{ width: 28, height: 28, display: 'block', filter: 'drop-shadow(0 1px 2px #1976d2)', color: '#2196f3' }} />
            </li>
            <Link to="dodajpsa">
              <li title={t('adddog.title')}>
                <span className="eky-icon eky-add-dog">+</span>
              </li>
            </Link>
            {isAuthenticated && user ? (
              <li title={`${user.username} - ${t('userProfile.welcome') || 'User Profile'}`} onClick={handleUserIconClick} style={{ cursor: 'pointer' }}>
                <span className="eky-icon eky-user"></span>
              </li>
            ) : (
              <Link to="logiranje">
                <li title={t('nav.login')}>
                  <span className="eky-icon eky-user"></span>
                </li>
              </Link>
            )}
            <li title={t('search.placeholder')} onClick={handleSearchIconClick} style={{ cursor: 'pointer' }}>
              <span className="eky-icon eky-search"></span>
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
      {showSearchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>{t('search.title') || 'Search Dogs'}</h2>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="search"
                placeholder={t('search.placeholder') || 'Search for dogs...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>
                    {t('search.recentSearches') || 'Recent Searches:'}
                  </label>
                  <button
                    onClick={clearSearchHistory}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(term)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '25px',
                        background: searchTerm === term ? '#72211f' : '#f0f0f0',
                        color: searchTerm === term ? 'white' : '#555',
                        cursor: 'pointer',
                        fontSize: '13px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        minWidth: 'fit-content'
                      }}
                      title={term}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                onClick={() => handleFilterClick('gender', 'male')}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '30px',
                  background: selectedGender === 'male' ? '#72211f' : '#f8f9fa',
                  color: selectedGender === 'male' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('dog.male') || 'Male'}
              </button>
              <button
                onClick={() => handleFilterClick('gender', 'female')}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '30px',
                  background: selectedGender === 'female' ? '#72211f' : '#f8f9fa',
                  color: selectedGender === 'female' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('dog.female') || 'Female'}
              </button>
              <button
                onClick={() => handleFilterClick('size', 'small')}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '30px',
                  background: selectedSize === 'small' ? '#72211f' : '#f8f9fa',
                  color: selectedSize === 'small' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('dog.small') || 'Small'}
              </button>
              <button
                onClick={() => handleFilterClick('size', 'large')}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '30px',
                  background: selectedSize === 'large' ? '#72211f' : '#f8f9fa',
                  color: selectedSize === 'large' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('dog.large') || 'Large'}
              </button>
            </div>

            {/* Location Filter */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 500, color: '#666', marginRight: 8 }}>{t('search.location') || 'Location'}:</label>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '25px',
                  fontSize: '14px',
                  minWidth: '120px',
                  marginLeft: 8
                }}
              >
                <option value="">{t('search.allLocations') || 'All Locations'}</option>
                {availableLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#72211f',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5a1a18'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#72211f'}
            >
              {t('button.search') || 'Search'}
            </button>
          </div>
        </div>
      )}

      {/* Removed <Routes> from Footer to prevent duplicate rendering */}
    </>
  );
};

export default Footer;
