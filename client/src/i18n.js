import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTrans from './locales/en/translation.json';
import enChat from './locales/en/chat.json';
import deTrans from './locales/de/translation.json';
import deChat from './locales/de/chat.json';
import hrTrans from './locales/hr/translation.json';
import hrChat from './locales/hr/chat.json';
import huTrans from './locales/hu/translation.json';
import huChat from './locales/hu/chat.json';

const resources = {
  en: { translation: { ...enTrans, ...enChat } },
  de: { translation: { ...deTrans, ...deChat } },
  hr: { translation: { ...hrTrans, ...hrChat } },
  hu: { translation: { ...huTrans, ...huChat } },
};

const initialLng = localStorage.getItem('i18nextLng') || 'hr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    debug: true, // Enable debug mode
  });

// Listen for language changes and log
i18n.on('languageChanged', (lng) => {
  // eslint-disable-next-line no-console
  console.log('[i18n] Language changed to:', lng);
  // Force reload of resources (workaround for some issues)
  i18n.reloadResources(lng);
});

export default i18n;
