import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '#', replacement: resolve(__dirname, 'src/components') },
    ],
  },
  ssr: {
    noExternal: ['styled-components'],
  },
});
