import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2F6FED',
        teal: '#14B8A6',
        sidebar: '#1F2D3D',
        page: '#F5F7FA'
      }
    }
  },
  plugins: [tailwindcssAnimate]
}
