import type { Metadata } from 'next';
import zhTW from '@/i18n/locales/zh_TW/translation.json';
import { heroVideoJsonLd } from '@/lib/seo/jsonLd';
import { HomePage } from '#/dimensions/home/HomePage';
import { LoaderBoot } from '#/dimensions/home/LoaderBoot';

const CANONICAL = 'https://mc-ctec.org/';

export const metadata: Metadata = {
  alternates: { canonical: CANONICAL },
};

const videoJsonLd = heroVideoJsonLd(
  zhTW.home.backgroundVideo.youtubeId,
  zhTW.dimensions.hero.video,
  zhTW.dimensions.hero.lead,
);

export default function Page() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <HomePage boot={<LoaderBoot />} />
    </>
  );
}
