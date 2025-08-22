/**** Tailwind Config ****/ 
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          dark: '#0d4f4a'
        }
      }
    }
  },
  plugins: []
};
