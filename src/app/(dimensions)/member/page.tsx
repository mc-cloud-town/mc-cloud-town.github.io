import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { breadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { MemberPageView } from './PageView';

const CANONICAL = 'https://mc-ctec.org/member/';
const { members, nav } = zhTW.dimensions;

export const metadata: Metadata = {
  title: '成員名單｜雲鎮工藝紅石・建築・後勤成員 | CloudTown',
  description: `${members.lead}${members.groups.member.line}`,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: members.title.join(''),
    description: members.lead,
    url: CANONICAL,
    images: [{ url: '/assets/members/CTEC_Members.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: members.title.join(''),
    description: members.lead,
    images: ['/assets/members/CTEC_Members.webp'],
  },
};

const crumbs = [
  { href: '/', label: nav.homeShort },
  { href: '/#end', label: nav.end },
  { label: members.crumb },
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
      <MemberPageView />
    </>
  );
}
