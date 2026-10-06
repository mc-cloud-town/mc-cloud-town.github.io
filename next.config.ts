import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  compiler: {
    styledComponents: { displayName: false, ssr: true },
  },
};

export default nextConfig;
