import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { SurvivalProgressPageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/survivalProgress/';
const { progress, nav } = zhTW.dimensions;

export const metadata: Metadata = {
  title: '生存進度紀錄｜2022 年開服從未重置的 Minecraft 世界 | CloudTown',
  description: progress.leadPlain,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: progress.title.join(''),
    description: progress.leadPlain,
    url: CANONICAL,
    images: [{ url: '/assets/homePage/CTEC_Building.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: progress.title.join(''),
    description: progress.leadPlain,
    images: ['/assets/homePage/CTEC_Building.webp'],
  },
};

const crumbs = [
  { href: '/', label: nav.homeShort },
  { label: progress.crumb },
];

export default function Page() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs, CANONICAL)),
        }}
      />
      <SurvivalProgressPageView />
    </>
  );
}
