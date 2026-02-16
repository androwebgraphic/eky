import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const languages = [
    { code: 'hr', name: 'HR' },
    { code: 'en', name: 'EN' },
    { code: 'de', name: 'DE' },
    { code: 'hu', name: 'HU' },
  ];

  const handleSelect = (langCode: string) => {
    i18n.changeLanguage(langCode).then(() => {
      console.log('[LanguageSelector] Language changed to', langCode);
      i18n.reloadResources(langCode);
    });
    localStorage.setItem('i18nextLng', langCode);
    setIsOpen(false);
  };

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[1]; // Default to EN

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('language.selectAria')}
        style={{
          background: 'transparent',
          border: '1px solid rgba(248, 248, 248, 0.3)',
          borderRadius: '3px',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#f8f8f8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'inherit',
          lineHeight: '1.2',
        }}
      >
        {currentLang.name}
        <span style={{ fontSize: '8px', marginLeft: '2px', opacity: 0.8 }}>▼</span>
      </button>

      {isOpen && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '80px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: lang.code === i18n.language ? '600' : '400',
                color: '#333',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {lang.name}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default LanguageSelector;
