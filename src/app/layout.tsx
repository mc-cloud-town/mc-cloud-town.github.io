import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import { ThemeProvider, themeInitScript } from '@/context/ThemeContext';

const SITE_URL = 'https://mc-ctec.org/';
const TITLE = 'CloudTown 雲鎮工藝 - Minecraft 紅石・生電・建築技術伺服器';
const SITE_NAME = 'CloudTown 雲鎮工藝';
const DESCRIPTION =
  'CloudTown 雲鎮工藝（CTEC）是一個以純原版為基礎的審核制技術向 Minecraft 伺服器：在原版規則裡研究紅石、生電裝置與建築，經營一個開服至今沒有重置過的生存世界。我們是來自亞洲的技術生存社群，重視並保護成員的智慧財產權，歡迎紅石、建築及後勤領域的人才加入。';
/** Not stated in the site's own visible copy (which says only "Asia" / "1st in Asia") — kept to metadata that
    readers don't see, per the team's "Asia first, Taiwan second" call. */
const KEYWORDS =
  'minecraft,minecraft 伺服器,紅石服,紅石,生電,生電服,建築,生存,技術向伺服器,雲鎮,雲鎮工藝,我的世界,台灣 minecraft,亞洲 minecraft 伺服器,技術,CTEC,CloudTown,CloudTown 雲鎮工藝';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: KEYWORDS,
  abstract: SITE_NAME,
  other: { subject: SITE_NAME },
  verification: { google: 'HOjdvGXCwtO_LoZ5vmktEoRxt20S6h8O5ArMTCSoSHc' },
  alternates: { canonical: SITE_URL },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.ico', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.ico', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-64x64.ico', type: 'image/png', sizes: '64x64' },
    ],
  },
  openGraph: {
    title: SITE_NAME,
    siteName: SITE_NAME,
    description: DESCRIPTION,
    url: SITE_URL,
    type: 'website',
    images: [{ url: '/banner.jpg', secureUrl: '/banner.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DESCRIPTION,
    images: ['/banner.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

/** The day the server opened, in Taipei — the same real date `JoinGuide.tsx`'s `OPENED` constant counts from. */
const FOUNDING_DATE = '2022-07-23';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}brand.webp`,
  foundingDate: FOUNDING_DATE,
  // The site's own words say only "Asia" / "1st in Asia" (dimensions.respawn.body, dimensions.rank) — Taiwan is
  // added here, not to any visible copy, per the team's "Asia first, Taiwan second" call.
  areaServed: ['Asia', 'TW'],
  knowsAbout: [
    'Redstone engineering',
    'Minecraft survival servers',
    'Minecraft architecture and building',
    '紅石',
    '生電',
    '建築',
  ],
  sameAs: [
    'https://www.youtube.com/@CTEC_',
    'https://twitter.com/CT_cloudtown',
    'https://discord.gg/H6uHghNq5Z',
    'https://github.com/mc-cloud-town',
  ],
  description: DESCRIPTION,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: ['zh-Hant', 'zh-Hans', 'en'],
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-Hant' suppressHydrationWarning>
      <head>
        {/* A plain inline script, first in the head: it runs while the document is parsed, so the reader's theme
            is on the document before anything is painted. (next/script's beforeInteractive only queues it for
            the framework's own script, which comes later than the first paint on a slow line: the page was then
            painted by night and cross-faded to the day.) */}
        <script
          id='theme-init'
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        {/* the fonts' stylesheet itself is asked for by the shell, page by page (FontSheet.tsx) */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <div id='root'>
          <ThemeProvider>{children}</ThemeProvider>
        </div>
        <Script
          src='https://www.googletagmanager.com/gtag/js?id=G-091JNQ58E9'
          strategy='afterInteractive'
        />
        <Script id='gtag-init' strategy='afterInteractive'>
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-091JNQ58E9');`}
        </Script>
        <Script
          src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5347413959647279'
          strategy='afterInteractive'
          crossOrigin='anonymous'
        />
      </body>
    </html>
  );
}
