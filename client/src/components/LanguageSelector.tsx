import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang).then(() => {
      // eslint-disable-next-line no-console
      console.log('[LanguageSelector] Language changed to', newLang);
      i18n.reloadResources(newLang);
    });
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <select 
      value={i18n.language} 
      onChange={handleChange} 
      aria-label={t('language.selectAria')}
      style={{ 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'clip',
        position: 'relative',
        zIndex: 10000,
        cursor: 'pointer'
      }}
    >
      <option value="hr">HR</option>
      <option value="en">EN</option>
      <option value="de">DE</option>
      <option value="hu">HU</option>
    </select>
  );
};

export default LanguageSelector;
