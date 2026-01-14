import React from 'react';
import Button from '../Button';
import Welcome from '../Welcome';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <main>
      <h3>{t('nav.about')} {t('brand.name')}</h3>
      <h3>{t('about.founded')}</h3>
      <p>
        {t('about.p1')}{' '}
        <strong>{t('about.p1strong')}</strong>.
      </p>
      <p>{t('about.p2')}</p>
      <p>
        {t('about.p3')}{' '}
        <span className="eky-icon eky-heart"></span>
      </p>
      <Welcome />
      <Button text={t('button.findFriend')} />
    </main>
  );
};

export default About;
