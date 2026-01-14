import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import de from './locales/de/translation.json';
import hr from './locales/hr/translation.json';
import hu from './locales/hu/translation.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  hr: { translation: hr },
  hu: { translation: hu },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('i18nextLng') || 'hr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
