const config = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue'
  ],
  theme: { extend: {} },
  plugins: [require('daisyui')],
  daisyui: { themes: ['light', 'dark'] }
}
export default config
