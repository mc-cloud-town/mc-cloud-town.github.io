import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationZH_CN from './locales/zh_CN/translation.json';
import translationZH_TW from './locales/zh_TW/translation.json';

export const resources = {
  en: {
    translation: translationEN,
  },
  zh_CN: {
    translation: translationZH_CN,
  },
  zh_TW: {
    translation: translationZH_TW,
  },
  zh: {
    translation: translationZH_TW,
  },
};

const LANGUAGE_STORAGE_KEY = 'i18nextLng';

/** Language rendered at build time; matches `<html lang>`. */
export const DEFAULT_LANGUAGE = 'zh';

const initI18n = () => {
  if (i18n.isInitialized) {
    return i18n;
  }

  i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources,
      // Pre-rendered pages (and hydration) use the default language; the
      // detector picks the visitor's language after mount, see detectLanguage.
      lng: DEFAULT_LANGUAGE,
      fallbackLng: 'en',
      debug: false,
      initImmediate: false,
      detection: {
        order: ['querystring', 'localStorage', 'htmlTag'],
        lookupQuerystring: 'lang',
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        // Caching is done in detectLanguage; caching here would store the
        // build-time default on init and overwrite the visitor's choice.
        caches: [],
      },
      interpolation: {
        escapeValue: false,
      },
    })
    .then();

  return i18n;
};

/**
 * Switch to the visitor's language (querystring > localStorage > html lang).
 * Must only be called on the client.
 */
export const detectLanguage = () => {
  const detected = i18n.services.languageDetector?.detect();
  i18n.changeLanguage(detected ?? DEFAULT_LANGUAGE).then(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, i18n.language);
    i18n.on('languageChanged', (lng) =>
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng),
    );
  });
};

export default initI18n;
