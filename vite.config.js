import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'
import path from 'path'

// Read version from package.json at build time
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'FinFlow - Gerenciamento Financeiro',
        short_name: 'FinFlow',
        description: 'Seu app de gerenciamento financeiro pessoal',
        theme_color: '#6C5CE7',
        background_color: '#0F0F14',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Fix tslib resolution for @supabase packages with Vite 8 / Rolldown
      tslib: path.resolve('./node_modules/tslib/tslib.es6.mjs'),
    },
  },
  server: {
    host: true,
    port: 5173
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  }
})
