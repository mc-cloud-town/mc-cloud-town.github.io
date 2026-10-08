'use client';

import { useI18nBoot } from '@/i18n/useI18nBoot';
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
    <DimensionProvider>
      {children}
      {/* over every page of the shell, and still there while one page gives way to the next */}
      <Cover />
    </DimensionProvider>
  );
}
