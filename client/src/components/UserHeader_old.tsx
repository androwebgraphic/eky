import React from 'react';
import { useTranslation } from 'react-i18next';

const UserHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="UserHeader">
      <img src="../img/androcolored-80x80.jpg" alt={t('userHeader.avatarAlt')} />

      <h3>{t('userHeader.name', { name: 'Andreas Sklizovich' })}</h3>

      <p>{t('userHeader.followers', { count: 100 })}</p>
      <p>{t('userHeader.following', { count: 110 })}</p>
    </div>
  );
};

export default UserHeader;
