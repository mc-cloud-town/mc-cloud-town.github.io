import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { OpenSourcePageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/openSource/';
const { openSource, nav } = zhTW.dimensions;

export const metadata: Metadata = {
  title: '開源專案｜CloudTown 雲鎮工藝 GitHub 開源插件與工具',
  description: openSource.lead,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: openSource.title.join(''),
    description: openSource.lead,
    url: CANONICAL,
    images: [{ url: '/assets/openSource/CTEC_Development.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: openSource.title.join(''),
    description: openSource.lead,
    images: ['/assets/openSource/CTEC_Development.webp'],
  },
};

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#end', label: nav.end },
  { label: openSource.crumb },
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
      <OpenSourcePageView />
    </>
  );
}
