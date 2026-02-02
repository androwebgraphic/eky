import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTrans from './locales/en/translation.json';
import enChat from './locales/en/chat.json';
import deTrans from './locales/de/translation.json';
import hrTrans from './locales/hr/translation.json';
import hrChat from './locales/hr/chat.json';
import huTrans from './locales/hu/translation.json';

const resources = {
  en: { translation: { ...enTrans, ...enChat } },
  de: { translation: deTrans },
  hr: { translation: { ...hrTrans, ...hrChat } },
  hu: { translation: huTrans },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('i18nextLng') || 'hr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
