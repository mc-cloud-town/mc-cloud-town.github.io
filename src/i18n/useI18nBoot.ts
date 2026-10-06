'use client';

import { useEffect } from 'react';
import initI18n, { detectLanguage } from '@/i18n/i18nConfig';

initI18n();

let detected = false;

/** Start i18n on the client. Safe to call from more than one shell. */
export const useI18nBoot = () => {
  useEffect(() => {
    if (detected) return;
    detected = true;
    detectLanguage();
  }, []);
};
