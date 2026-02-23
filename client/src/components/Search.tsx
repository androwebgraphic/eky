import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface SearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  genderFilter: string;
  onGenderChange: (gender: string) => void;
  sizeFilter: string;
  onSizeChange: (size: string) => void;
  ageFilter: string;
  onAgeChange: (age: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  searchActive?: boolean;
}

const Search: React.FC<SearchProps> = ({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderChange,
  sizeFilter,
  onSizeChange,
  ageFilter,
  onAgeChange,
  searchInputRef,
  searchActive = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Check if any filter is active
  const hasActiveFilters = searchTerm || genderFilter || sizeFilter || ageFilter;
  
  // Clear all filters and navigate to clean URL
  const handleClear = () => {
    onSearchChange('');
    onGenderChange('');
    onSizeChange('');
    onAgeChange('');
    // Navigate to clean URL without query parameters
    navigate('/psi', { replace: true });
  };
  
  return (
    <div className="search-container">
      {/* Basic search row */}
      <div className="search-row">
        <div style={{ flex: '1', minWidth: '150px' }}>
          <input 
            type="search" 
            id="Search" 
            ref={searchInputRef}
            className={`search-input ${searchActive ? 'active' : ''}`}
            placeholder={t('search.placeholder') || 'Search by breed, size, or location...'}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="search-btn"
          style={{
            border: '1px solid #75171a',
            backgroundColor: '#f5f5f0',
            color: '#75171a'
          }}
        >
          {showAdvanced ? t('search.hideAdvanced') || 'Hide Advanced' : t('search.showAdvanced') || 'Advanced Search'}
        </button>
        
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="search-btn"
            style={{
              border: '1px solid #e74c3c',
              backgroundColor: '#e74c3c',
              color: '#fff'
            }}
          >
            {t('search.clear') || 'Clear'}
          </button>
        )}
      </div>
      
      {/* Advanced filters - conditionally shown */}
      {showAdvanced && (
        <div className="search-row advanced">
          <div className="search-filter-group">
            <label className="search-filter-label">
              {t('search.gender') || 'Gender'}
            </label>
            <select 
              value={genderFilter} 
              onChange={(e) => onGenderChange(e.target.value)}
              className="search-select"
            >
              <option value="">{t('search.allGenders')}</option>
              <option value="male">{t('gender.male')}</option>
              <option value="female">{t('gender.female')}</option>
            </select>
          </div>
          
          <div className="search-filter-group">
            <label className="search-filter-label">
              {t('search.size') || 'Size'}
            </label>
            <select 
              value={sizeFilter} 
              onChange={(e) => onSizeChange(e.target.value)}
              className="search-select"
            >
              <option value="">{t('search.allSizes')}</option>
              <option value="small">{t('size.small')}</option>
              <option value="medium">{t('size.medium')}</option>
              <option value="large">{t('size.large')}</option>
            </select>
          </div>
          
          <div className="search-filter-group">
            <label className="search-filter-label">
              {t('search.age') || 'Age'}
            </label>
            <select 
              value={ageFilter} 
              onChange={(e) => onAgeChange(e.target.value)}
              className="search-select"
            >
              <option value="">{t('search.allAges') || 'All Ages'}</option>
              <option value="puppy">{t('search.age.puppy') || 'Puppy (0-1 year)'}</option>
              <option value="young">{t('search.age.young') || 'Young (1-3 years)'}</option>
              <option value="adult">{t('search.age.adult') || 'Adult (3-8 years)'}</option>
              <option value="senior">{t('search.age.senior') || 'Senior (8+ years)'}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;