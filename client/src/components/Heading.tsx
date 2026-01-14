import React from 'react';
import { useTranslation } from 'react-i18next';

interface HeadingProps {
  name?: string;
}

const Heading: React.FC<HeadingProps> = (props) => {
 
  const { t } = useTranslation();
  return (
    <>
    (
      
        <>
          <h1>{t('heading.title')}</h1>
          <h2>{t('heading.subtitle')}</h2>
        </>
      
    </>
  );
};

export default Heading;
