import type { Config } from "tailwindcss";
// import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  safelist: [
    'fill-indigo-600',
    'bg-red-50',
    'bg-yellow-50',
    'bg-blue-50',
    'bg-green-50',
    'text-red-400',
    'text-yellow-400',
    'text-blue-400',
    'text-green-400',
    'text-red-700',
    'text-yellow-700',
    'text-blue-700',
    'text-green-700',
    'text-red-800',
    'text-yellow-800',
    'text-blue-800',
    'text-green-800',
    'border-red-400',
    'border-yellow-400',
    'border-blue-400',
    'border-green-400',
  ],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;

