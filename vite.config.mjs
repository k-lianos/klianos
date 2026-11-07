import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [tailwindcss()],
    build: {
        // The oldest browsers that support cascade layers, which every Tailwind rule sits in. Lightning CSS lowers newer syntax
        // for them, notably rewriting range media queries (width >= 48rem) to min-width, which Chrome < 104 and Safari < 16.4
        // don't understand. Anything older drops the layers whole and gets fallback.css instead.
        cssTarget: ['chrome99', 'edge99', 'firefox97', 'safari15.4'],
    },
});
