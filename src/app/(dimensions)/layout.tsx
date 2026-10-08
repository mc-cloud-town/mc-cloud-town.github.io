'use client';

import { usePathname } from 'next/navigation';
import { useI18nBoot } from '@/i18n/useI18nBoot';
import { dimensionInitScript, dimensionOfPath } from '@/lib/dimensions/pages';
import { DimensionProvider } from '#/dimensions/DimensionProvider';
import { Cover } from '#/dimensions/Cover';

import '@/styles/dimensions/tokens.css';
import '@/styles/dimensions/shell.css';
import '@/styles/dimensions/inner.css';
import '@/styles/dimensions/home.css';

export default function DimensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useI18nBoot();
  return (
    <DimensionProvider initial={dimensionOfPath(usePathname())}>
      {/* before anything of the shell is parsed: the page's dimension is on the document from the first paint */}
      <script dangerouslySetInnerHTML={{ __html: dimensionInitScript }} />
      {children}
      {/* over every page of the shell, and still there while one page gives way to the next */}
      <Cover />
    </DimensionProvider>
  );
}
