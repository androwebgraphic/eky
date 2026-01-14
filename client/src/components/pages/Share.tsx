import React from 'react';
import { useTranslation } from 'react-i18next';

const Share: React.FC = () => {
  const { t } = useTranslation();
  return <h1>{t('share.title')}</h1>;
};

export default Share;
