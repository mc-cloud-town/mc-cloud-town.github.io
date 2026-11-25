import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { PartnerPageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/partner/';
const { partner, nav } = zhTW.dimensions;

export const metadata: Metadata = {
  title: '合作夥伴與團隊｜CloudTown 雲鎮工藝',
  description: `${partner.lead}${partner.contact.body}`,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: partner.title.join(''),
    description: partner.lead,
    url: CANONICAL,
    images: [{ url: '/assets/partner/partner.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: partner.title.join(''),
    description: partner.lead,
    images: ['/assets/partner/partner.webp'],
  },
};

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#end', label: nav.end },
  { label: partner.crumb },
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
      <PartnerPageView />
    </>
  );
}
