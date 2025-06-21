export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['@/assets/css/tailwind.css'],
  modules: ['nuxt-icon', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  ssr: false,
  app: {
    baseURL: '/flashcard/',
    head: {
      title: 'My Flash Card',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Flash Card Application with AI support' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/flashcard/icon-192x192.svg' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/flashcard/icon-192x192.png' },
        { rel: 'shortcut icon', href: '/flashcard/favicon.ico' }],
    },
  },
  pwa: {
    devOptions: {
      enabled: true   // ← เปิด SW ใน pnpm dev
    },
    registerType: 'autoUpdate',
    manifest: {
      name: 'My Flash Card',
      short_name: 'FlashCard',
      start_url: '/flashcard/',
      display: 'standalone',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      navigateFallback: '/flashcard/',
      globPatterns: ['**/*.{js,css,html,svg,png}']
    }
  }
})