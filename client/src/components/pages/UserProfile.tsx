import React from 'react';
import Users from './Users';
import { useTranslation } from 'react-i18next';

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t('userProfile.welcome')} <span className="eky-icon eky-user"></span></h1>
      <Users />
    </>
  );
};

export default UserProfile;
