'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import i18n from 'i18next';
import { useI18nBoot } from '@/i18n/useI18nBoot';
import { dimensionInitScript, dimensionOfPath } from '@/lib/dimensions/pages';
import { DimensionProvider } from '#/dimensions/DimensionProvider';
import { Cover } from '#/dimensions/Cover';
import { PageTransitions } from '#/dimensions/PageTransitions';

import '@/styles/dimensions/tokens.css';
import '@/styles/dimensions/shell.css';
import '@/styles/dimensions/inner.css';
import '@/styles/dimensions/home.css';

/** The language tag of each language of the site, for `<html lang>`. (`zh` is the served default: Traditional.) */
const LANGUAGE_TAGS: Record<string, string> = {
  zh: 'zh-Hant',
  zh_TW: 'zh-Hant',
  zh_CN: 'zh-Hans',
  en: 'en',
};
/** What the served page says, and what a legacy page keeps. */
const SERVED_LANGUAGE_TAG = 'zh';

export default function DimensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useI18nBoot();
  // The document says which language it is in: the reader's, once it is known (a screen reader's voice, the
  // browser's offer to translate, the glyphs a fallback font picks all go by it). Set after hydration, so the
  // served page and the first render agree; and after the detection above, which reads this very attribute as
  // its last resort. Given back as it was served when the shell goes (a step to a legacy page).
  // (Listened for, not read while rendering: the i18n object is the same one whatever its language.)
  useEffect(() => {
    const say = (language: string) => {
      document.documentElement.lang =
        LANGUAGE_TAGS[language] ?? SERVED_LANGUAGE_TAG;
    };
    say(i18n.language);
    i18n.on('languageChanged', say);
    return () => {
      i18n.off('languageChanged', say);
      document.documentElement.lang = SERVED_LANGUAGE_TAG;
    };
  }, []);
  return (
    <DimensionProvider initial={dimensionOfPath(usePathname())}>
      {/* before anything of the shell is parsed: the page's dimension is on the document from the first paint */}
      <script dangerouslySetInnerHTML={{ __html: dimensionInitScript }} />
      {children}
      {/* over every page of the shell, and still there while one page gives way to the next */}
      <Cover />
      <PageTransitions />
    </DimensionProvider>
  );
}
