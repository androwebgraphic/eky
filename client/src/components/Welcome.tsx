import React from 'react';
import { useTranslation } from 'react-i18next';

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="logo">
        <img src="/img/logo.png" className="welcome" alt={t('brand.logoAlt')} />
    </div>
  );
};

export default Welcome;
