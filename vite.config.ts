import { URL, fileURLToPath } from 'node:url';

import Aerogel, { AerogelResolver } from '@aerogel/vite';
import Components from 'unplugin-vue-components/vite';
import I18n from '@intlify/unplugin-vue-i18n/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: { sourcemap: true },
    base: process.env.NODE_ENV === 'production' ? '/manga-reader/' : '/',
    publicDir: fileURLToPath(new URL('./src/assets/public/', import.meta.url)),
    plugins: [
        Aerogel({
            name: 'Manga Reader',
            description: '日本語を勉強しましょう！',
            baseUrl: 'https://noeldemartin.github.io/manga-reader/',
            themeColor: '#000',
            icons: [
                {
                    src: 'icons/transparent-512x512.png',
                    sizes: '512x512',
                    purpose: 'any',
                },
                {
                    src: 'icons/maskable-512x512.png',
                    sizes: '512x512',
                    purpose: 'maskable',
                },
                {
                    src: 'icons/transparent-192x192.png',
                    sizes: '192x192',
                    purpose: 'any',
                },
                {
                    src: 'icons/maskable-192x192.png',
                    sizes: '192x192',
                    purpose: 'maskable',
                },
            ],
        }),
        Components({
            deep: true,
            dts: 'src/types/components.d.ts',
            dirs: ['src/components', 'src/pages'],
            resolvers: [AerogelResolver(), IconsResolver()],
        }),
        I18n({ include: fileURLToPath(new URL('./src/lang/**/*.yaml', import.meta.url)) }),
        Icons({
            iconCustomizer(_, __, props) {
                props['aria-hidden'] = 'true';
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
