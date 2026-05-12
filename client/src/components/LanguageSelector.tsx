import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// Portal container for language dropdown (rendered at body level to escape stacking context)
const dropdownPortalRoot = typeof document !== 'undefined' 
  ? document.getElementById('lang-dropdown-portal') || (() => {
      const root = document.createElement('div');
      root.id = 'lang-dropdown-portal';
      root.style.position = 'absolute';
      root.style.top = '0';
      root.style.left = '0';
      root.style.zIndex = '0';
      root.style.pointerEvents = 'none';
      document.body.appendChild(root);
      return root;
    })()
  : null;

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 4, // 4px margin below button
        right: `${window.innerWidth - buttonRect.right}px`, // Align right edge
      });
    }
  }, [isOpen]);

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

  // Close dropdown when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
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
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[1];

  return (
    <div className="language-selector" style={{ 
      position: 'relative', 
      display: 'inline-block', 
      zIndex: 10002,
      visibility: 'visible',
      opacity: 1,
      width: 'auto',
      height: 'auto',
      minWidth: 'auto',
      maxWidth: 'none'
    }}>
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

      {isOpen && dropdownPosition && dropdownPortalRoot && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: dropdownPosition.right,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '80px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
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
        dropdownPortalRoot
      )}
    </div>
  );
};

export default LanguageSelector;
