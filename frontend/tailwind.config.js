/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  safelist: [
    "bg-app-background",
    "bg-app-background-soft",
    "bg-app-surface",
    "bg-app-surface-elevated",
    "bg-app-primary",
    "bg-app-primary-pressed",
    "bg-app-primary-light",
    "bg-app-primary-soft",

    "text-app-text",
    "text-app-text-secondary",
    "text-app-text-muted",
    "text-app-text-inverse",

    "border-app-border",
    "border-app-border-subtle",

    "bg-app-success",
    "bg-app-warning",
    "bg-app-error",
    "bg-app-info",
    "bg-app-disabled",

    "text-app-success",
    "text-app-warning",
    "text-app-error",
    "text-app-info",

    "active:bg-app-primary-pressed",
  ],

  theme: {
    extend: {
      colors: {
        app: {
          background: "#020F14",
          "background-soft": "#061C25",

          surface: "#082F49",
          "surface-elevated": "#0B3B5A",

          primary: "#0E7490",
          "primary-pressed": "#0C627A",
          "primary-light": "#0EA5D8",
          "primary-soft": "#C5EDF5",

          text: "#F8FAFC",
          "text-secondary": "#B8C6CC",
          "text-muted": "#78909A",
          "text-inverse": "#020F14",

          border: "#17475A",
          "border-subtle": "#102F3B",

          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#0EA5D8",
          disabled: "#425A64",
        },
      },
    },
  },

  plugins: [],
};