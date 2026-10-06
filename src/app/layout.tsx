import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import StyledComponentsRegistry from '@/lib/StyledComponentsRegistry';
import { ThemeProvider, themeInitScript } from '@/context/ThemeContext';

import 'antd/dist/reset.css';
import 'react-lazy-load-image-component/src/effects/blur.css';
import '@/app.css';

const SITE_URL = 'https://mc-ctec.org/';
const TITLE = 'CloudTown 雲鎮工藝 - Minecraft 技術向伺服器';
const SITE_NAME = 'CloudTown 雲鎮工藝';
const DESCRIPTION =
  'CloudTown 是一個以純原版為基礎的審核制技術向伺服器，我們的核心理念是創新和研發，我們非常重視及保護成員個人的智慧財產權，並在內互助與交流技術。歡迎各種建築及紅石領域的人才加入我們，當然你抱持著Minecraft的基礎知識和熱忱也可以！';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    'minecraft,minecraft 伺服器,紅石服,紅石,建築,生存,生電服,雲鎮,我的世界,技術,CTEC,CloudTown,CloudTown 雲鎮工藝',
  abstract: SITE_NAME,
  other: { subject: SITE_NAME },
  verification: { google: 'HOjdvGXCwtO_LoZ5vmktEoRxt20S6h8O5ArMTCSoSHc' },
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: 'https://www.mc-list.xyz/banner/1-1212.png',
  sameAs: [
    'https://www.youtube.com/@CTEC_',
    'https://twitter.com/CT_cloudtown',
  ],
  description: 'CloudTown 是一個以純原版為基礎的審核制技術向伺服器...',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh' suppressHydrationWarning>
      <head>
        <Script id='theme-init' strategy='beforeInteractive'>
          {themeInitScript}
        </Script>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href='https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&family=Noto+Serif+TC:wght@200..900&display=swap'
          rel='stylesheet'
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body>
        <div id='root'>
          <StyledComponentsRegistry>
            <AntdRegistry>
              <ThemeProvider>{children}</ThemeProvider>
            </AntdRegistry>
          </StyledComponentsRegistry>
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
