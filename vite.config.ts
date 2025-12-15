import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Hash filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Manual chunks for better code splitting
        manualChunks: {
          // Split React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split BlockNote editor (large dependency)
          'blocknote': ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],
          // Split Ant Design
          'antd': ['antd'],
          // Split other large libraries
          'vendor': ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Optimize chunk splitting
    chunkSizeWarningLimit: 1000,
  },
})
