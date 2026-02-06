import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  genderFilter: string;
  onGenderChange: (gender: string) => void;
  sizeFilter: string;
  onSizeChange: (size: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  availableLocations: string[];
}

const Search: React.FC<SearchProps> = ({
  searchTerm,
  onSearchChange,
  genderFilter,
  onGenderChange,
  sizeFilter,
  onSizeChange,
  locationFilter,
  onLocationChange,
  availableLocations
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="search-container" style={{
      marginBottom: '0.75rem',
      padding: '0.5rem',
      borderRadius: '4px'
    }}>
      {/* Basic search row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: showAdvanced ? '0.5rem' : '0'
      }}>
        <div style={{ flex: '1', minWidth: '150px' }}>
          <input 
            type="search" 
            id="Search" 
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.375rem',
              borderRadius: '7px',
              border: '1px solid #ddd',
              fontSize: '0.875rem',
              lineHeight: '1.2'
            }}
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '3px',
            border: '1px solid #75171a',
            backgroundColor: '#f5f5f0',
            color: '#75171a',
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          {showAdvanced ? t('search.hideAdvanced') || 'Hide Advanced' : t('search.showAdvanced') || 'Advanced Search'}
        </button>
      </div>
      
      {/* Advanced filters - conditionally shown */}
      {showAdvanced && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid #dee2e6'
        }}>
          <div style={{ minWidth: '100px', flex: '1' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              marginBottom: '0.25rem',
              color: '#666'
            }}>
              {t('search.gender') || 'Gender'}
            </label>
            <select 
              value={genderFilter} 
              onChange={(e) => onGenderChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem',
                borderRadius: '3px',
                border: '1px solid #ddd',
                fontSize: '0.875rem',
                lineHeight: '1.2'
              }}
            >
              <option value="">{t('search.allGenders')}</option>
              <option value="male">{t('gender.male')}</option>
              <option value="female">{t('gender.female')}</option>
            </select>
          </div>
          
          <div style={{ minWidth: '100px', flex: '1' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              marginBottom: '0.25rem',
              color: '#666'
            }}>
              {t('search.size') || 'Size'}
            </label>
            <select 
              value={sizeFilter} 
              onChange={(e) => onSizeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem',
                borderRadius: '7px',
                border: '1px solid #ddd',
                fontSize: '0.875rem',
                lineHeight: '1.2'
              }}
            >
              <option value="">{t('search.allSizes')}</option>
              <option value="small">{t('size.small')}</option>
              <option value="medium">{t('size.medium')}</option>
              <option value="large">{t('size.large')}</option>
            </select>
          </div>
          
          <div style={{ minWidth: '110px', flex: '1' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              marginBottom: '0.25rem',
              color: '#666'
            }}>
              {t('search.location') || 'Location'}
            </label>
            <select 
              value={locationFilter} 
              onChange={(e) => onLocationChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem',
                borderRadius: '3px',
                border: '1px solid #ddd',
                fontSize: '0.875rem',
                lineHeight: '1.2'
              }}
            >
              <option value="">{t('search.allLocations')}</option>
              {availableLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
