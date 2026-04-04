// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       colors: {
//         primary: '#f9a8d4',
//         secondary: '#ec4899',
//       },
//     },
//   },
//   plugins: [require('@tailwindcss/typography')],
// };




/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'sans-serif'],
        kansas: ['New Kansas', 'serif'],
      },
      colors: {
        // Mapping your HSL shades to the primary key
        // <alpha-value> enables bg-primary/10 opacity utilities
        primary: {
          light: 'hsl(var(--primary-light) / <alpha-value>)', // #C04878
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',     // #AC2660
          dark: 'hsl(var(--primary-dark) / <alpha-value>)',   // #8A1748
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};