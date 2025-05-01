/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                shine: {
                    '0%': { 'background-position': '100%' },
                    '100%': { 'background-position': '-100%' }
                },
                'star-movement-bottom': {
                    '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
                    '100%': { transform: 'translate(-100%, 0%)', opacity: '0' }
                },
                'star-movement-top': {
                    '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
                    '100%': { transform: 'translate(100%, 0%)', opacity: '0' }
                },
                'border-glow': {
                    '0%, 100%': { opacity: '0.3' },
                    '50%': { opacity: '0.6' }
                },
                'border-run': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(200%)' }
                },
                'border-run-reverse': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-200%)' }
                }
            },
            animation: {
                shine: 'shine 5s linear infinite',
                'star-movement-bottom': 'star-movement-bottom 1s linear infinite alternate',
                'star-movement-top': 'star-movement-top 1s linear infinite alternate',
                'border-glow': 'border-glow 3s ease-in-out infinite',
                'border-run': 'border-run 2s linear infinite',
                'border-run-reverse': 'border-run-reverse 2s linear infinite'

            }
        }
    },
    plugins: []
}


