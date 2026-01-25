import React from 'react';
import { useTranslation } from 'react-i18next';

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const logoSrc = lang === 'hr' ? '/img/SVG/croatian.svg' : '/img/SVG/english.svg';
  return (
    <div className="logo">
        <img src={logoSrc} className="welcome" alt={t('brand.logoAlt')} />
    </div>
  );
};

export default Welcome;
