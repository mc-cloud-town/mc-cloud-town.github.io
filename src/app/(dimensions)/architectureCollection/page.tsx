import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { fetchWorksAtBuildTime } from '@/lib/dimensions/works';
import { breadcrumbJsonLd, collectionItemListJsonLd } from '@/lib/seo/jsonLd';
import { ArchitectureCollectionPageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/architectureCollection/';
const { collection, nav } = zhTW.dimensions;
const { architecture } = collection;

export async function generateMetadata(): Promise<Metadata> {
  const works = await fetchWorksAtBuildTime('architecture');
  const description = works
    ? architecture.lead.replace('{{total}}', String(works.length))
    : architecture.leadPlain;
  return {
    title: '建築作品集｜Minecraft 生存模式建築 | CloudTown 雲鎮工藝',
    description,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: architecture.title.join(''),
      description,
      url: CANONICAL,
      images: [{ url: '/assets/homePage/CTEC_Building.webp' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: architecture.title.join(''),
      description,
      images: ['/assets/homePage/CTEC_Building.webp'],
    },
  };
}

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#overworld', label: nav.overworld },
  { label: architecture.crumb },
];

export default async function Page() {
  const works = await fetchWorksAtBuildTime('architecture');
  const itemList = works
    ? collectionItemListJsonLd(
        works.map((w) => ({
          title: w.title,
          creators: w.creators,
          date: w.date,
          image: w.cover,
        })),
        architecture.crumb,
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
      <ArchitectureCollectionPageView />
    </>
  );
}

