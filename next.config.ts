import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // The year the site was built in, written into both the served pages and the script: the footer shows it until
  // the reader's own year is known, and the two agree at hydration whatever year it is by then (SiteFooter.tsx).
  env: { NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()) },
  compiler: {
    styledComponents: { displayName: false, ssr: true },
  },
};

export default nextConfig;
