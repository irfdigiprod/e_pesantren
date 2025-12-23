/** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
//   theme: {
//     extend: {
      // fontFamily: {
      //   jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
      // },
//       colors: {
//         primary: "#602515",
//         secondary: "#f8ae19",
//       },
//     },
//   },
//   plugins: [],
// };
// tailwind.config.cjs
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#602515",
          50:  "#f7eeeb",
          100: "#ead7d1",
          200: "#d3afa3",
          300: "#b88572",
          400: "#995849",
          500: "#7e3c2f",
          600: "#602515", // utama
          700: "#4e1e12",
          800: "#3b170c",
          900: "#2b1008",
        },
        secondary: {
          DEFAULT: "#f8ae19",
          50:  "#fff8e6",
          100: "#ffeec2",
          200: "#ffdf8f",
          300: "#ffd05d",
          400: "#ffc033",
          500: "#f8ae19", // utama
          600: "#d99114",
          700: "#b3740f",
          800: "#8c580a",
          900: "#6f4607",
        }
      },
    },
  },
  plugins: [],
};
