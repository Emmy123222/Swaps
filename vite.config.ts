import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { Buffer } from 'buffer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'globalThis.Buffer': Buffer,
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  resolve: {
    alias: {
      'bcs': '@aptos-labs/ts-sdk/dist/bcs',
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'], // Add .json explicitly
  },
});