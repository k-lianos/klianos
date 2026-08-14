import { defineConfig } from 'vite';

export default defineConfig({
    // Served from https://k-lianos.github.io/klianos/, so assets need the repo
    // name prefixed. Drop this if the site ever moves to a root domain or the
    // repo is renamed to k-lianos.github.io.
    base: '/klianos/',
});
