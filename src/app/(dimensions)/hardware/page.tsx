import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { NETHER_IMAGES } from '@/constants/scenes';
import { HardwarePageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/hardware/';
const { hardware, nav } = zhTW.dimensions;
const IMAGE = NETHER_IMAGES[1];

export const metadata: Metadata = {
  title: '伺服器硬體規格｜CloudTown 雲鎮工藝 Minecraft 技術伺服器',
  description: `${hardware.lead}：支援大量玩家同時在線、低延遲、專業工程團隊維護的 Minecraft 紅石與建築生存伺服器。`,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: hardware.title.join(''),
    description: hardware.lead,
    url: CANONICAL,
    images: [{ url: IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: hardware.title.join(''),
    description: hardware.lead,
    images: [IMAGE],
  },
};

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#nether', label: nav.nether },
  { label: hardware.crumb },
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
      <HardwarePageView />
    </>
  );
}
