import React from 'react';
import Button from '../Button';
import Welcome from '../Welcome';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <h3 style={{ fontSize: '3.2rem', lineHeight: '3.6rem', margin: '0.3rem 0', color: '#FF9800' }}>{t('nav.about')} {t('brand.name')}</h3>
      <h3 style={{ fontSize: '3.2rem', lineHeight: '3.6rem', margin: '0.3rem 0', color: '#FF9800' }}>{t('about.founded')}</h3>
      <div className="about-paragraphs" style={{ marginTop: '0' }}>
        <p style={{ fontSize: '2.2rem', lineHeight: '2.6rem', margin: '0.2rem 0' }}>
          {t('about.p1')}{' '}
          <strong>{t('about.p1strong')}</strong>.
        </p>
        <p style={{ fontSize: '2.2rem', lineHeight: '2.6rem', margin: '0.2rem 0' }}>{t('about.p2')}</p>
        <p style={{ fontSize: '2.2rem', lineHeight: '2.6rem', margin: '0.2rem 0' }}>
          {t('about.p3')}{' '}
          <span className="sharedog-icon sharedog-Heart" style={{ color: 'red' }}></span>
        </p>
      </div>
      <Welcome />
      <div className="about-button-container" style={{ marginTop: '-8rem', marginBottom: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Button text={t('button.findFriend')} />
      </div>
    </>
  );
};

export default About;
