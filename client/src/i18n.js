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
