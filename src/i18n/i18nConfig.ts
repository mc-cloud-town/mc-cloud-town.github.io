import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationZH_CN from './locales/zh_CN/translation.json';
import translationZH_TW from './locales/zh_TW/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  zh_CN: {
    translation: translationZH_CN
  },
  zh_TW: {
    translation: translationZH_TW
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh_TW",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
