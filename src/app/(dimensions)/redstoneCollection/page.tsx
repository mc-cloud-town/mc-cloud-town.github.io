import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { fetchWorksAtBuildTime } from '@/lib/dimensions/works';
import { breadcrumbJsonLd, collectionItemListJsonLd } from '@/lib/seo/jsonLd';
import { RedstoneCollectionPageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/redstoneCollection/';
const { collection, nav } = zhTW.dimensions;
const { redstone } = collection;

export async function generateMetadata(): Promise<Metadata> {
  const works = await fetchWorksAtBuildTime('redstone');
  const description = works
    ? redstone.lead.replace('{{total}}', String(works.length))
    : redstone.leadPlain;
  return {
    title: '紅石作品集｜Minecraft 生存模式紅石・生電裝置 | CloudTown 雲鎮工藝',
    description,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: redstone.title.join(''),
      description,
      url: CANONICAL,
      images: [{ url: '/assets/redstoneCollection/p30.webp' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: redstone.title.join(''),
      description,
      images: ['/assets/redstoneCollection/p30.webp'],
    },
  };
}

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#nether', label: nav.nether },
  { label: redstone.crumb },
];

export default async function Page() {
  const works = await fetchWorksAtBuildTime('redstone');
  const itemList = works
    ? collectionItemListJsonLd(
        works.map((w) => ({
          title: w.title,
          creators: w.creators,
          date: w.date,
          image: w.cover,
        })),
        redstone.crumb,
      )
    : null;
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs, CANONICAL)),
        }}
      />
      {itemList && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
        />
      )}
      <RedstoneCollectionPageView />
    </>
  );
}
