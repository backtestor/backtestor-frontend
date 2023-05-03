/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,astro}"],
  theme: {
    extend: {
      cursor: {
        grab: "grab",
      },
      fontSize: {
        xxs: ".5rem",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    styled: true,
    themes: [
      {
        light: {
          // @ts-expect-error
          ...require("daisyui/src/colors/themes")["[data-theme=light]"],
          primary: "#004fc2",
          "base-100": "#fcfcfc",
        },
      },
      {
        dark: {
          // @ts-expect-error
          ...require("daisyui/src/colors/themes")["[data-theme=dark]"],
          primary: "#004fc2",
          "base-100": "#1a1a1a",
        },
      },
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "dark",
  },
};
