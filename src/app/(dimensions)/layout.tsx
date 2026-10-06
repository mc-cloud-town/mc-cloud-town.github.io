'use client';

import { useI18nBoot } from '@/i18n/useI18nBoot';
import { DimensionProvider } from '#/dimensions/DimensionProvider';

import '@/styles/dimensions/tokens.css';
import '@/styles/dimensions/shell.css';
import '@/styles/dimensions/inner.css';

export default function DimensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useI18nBoot();
  return <DimensionProvider>{children}</DimensionProvider>;
}
