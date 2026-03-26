import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Three.js ecosystem — largest dependency (~300kB gzip)
              'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
              // Animation library (~30-50kB gzip)
              'vendor-motion': ['framer-motion'],
              // React core
              'vendor-react': ['react', 'react-dom'],
            },
          },
        },
      },
    };
});
