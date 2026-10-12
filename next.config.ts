import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // The year the site was built in, written into both the served pages and the script: the footer shows it until
  // the reader's own year is known, and the two agree at hydration whatever year it is by then (SiteFooter.tsx).
  // And which build this is: the home page's loader knows by it whether a reader has this build's files already
  // (loaderCore.ts, WARM_KEY).
  env: {
    NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()),
    NEXT_PUBLIC_BUILD_ID: Date.now().toString(36),
  },
};

export default nextConfig;
