import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteCompression from 'vite-plugin-compression';
import generateSitemap from 'sitemap-ts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteCompression()],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '#', replacement: resolve(__dirname, 'src/components') },
    ],
  },
  ssgOptions: {
    formatting: 'minify',
    dirStyle: 'nested',
    script: 'async',
    crittersOptions: {
      preload: 'media',
    },
    onFinished() {
      generateSitemap({
        hostname: process.env.HOSTNAME || 'http://localhost/',
        robots: [{ userAgent: '*', allow: '/' }],
      });
    },
  },
  ssr: {
    noExternal: ['styled-components'],
  },
});
