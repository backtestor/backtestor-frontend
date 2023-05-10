/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{ts,astro}"],
  theme: {
    extend: {
      cursor: {
        grab: "grab",
      },
      fontSize: {
        xxs: ".5rem",
      },
      colors: {
        transparent: "transparent",
        current: "currentColor",
        base: "hsl(var(--base) / <alpha-value>)",
        "base-subtle": "hsl(var(--base-subtle) / <alpha-value>)",
        content: "hsl(var(--content) / <alpha-value>)",
        "content-subtle": "hsl(var(--content-subtle) / <alpha-value>)",
        neutral: "hsl(var(--neutral) / <alpha-value>)",
        "neutral-focus": "hsl(var(--neutral-focus) / <alpha-value>)",
        "neutral-content": "hsl(var(--neutral-content) / <alpha-value>)",
        "color-content": "hsl(var(--color-content) / <alpha-value>)",
        "color-primary": "hsl(var(--color-primary) / <alpha-value>)",
        "color-primary-focus": "hsl(var(--color-primary-focus) / <alpha-value>)",
        "color-secondary": "hsl(var(--color-secondary) / <alpha-value>)",
        "color-secondary-focus": "hsl(var(--color-secondary-focus) / <alpha-value>)",
        "color-positive": "hsl(var(--color-positive) / <alpha-value>)",
        "color-positive-focus": "hsl(var(--color-positive-focus) / <alpha-value>)",
        "color-negative": "hsl(var(--color-negative) / <alpha-value>)",
        "color-negative-focus": "hsl(var(--color-negative-focus) / <alpha-value>)",
        "color-warning": "hsl(var(--color-warning) / <alpha-value>)",
        "color-warning-focus": "hsl(var(--color-warning-focus) / <alpha-value>)",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
