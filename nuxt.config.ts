export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['@/assets/css/tailwind.css'],
  modules: ['nuxt-icon', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt' ],
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
        { rel: 'icon', type: 'image/svg+xml', href: '/icon-192x192.svg' },
      ],
    },
  },
  pwa: {
    manifest: false,
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg}'],
    },
  }
})