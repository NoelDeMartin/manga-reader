import Aerogel from '@aerogel/vite';
import { fmt, lint } from '@noeldemartin/vite-plus-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/manga-reader/' : '/',
    plugins: [Aerogel({ name: 'Manga Reader' })],
    fmt,
    lint: { extends: [lint] },
});
