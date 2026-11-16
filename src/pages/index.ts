import { defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';

import ChapterModel from '@/models/Chapter.ts';
import SeriesModel from '@/models/Series.ts';

import Chapter from './Chapter.vue';
import Home from './Home.vue';
import Series from './Series.vue';

export const bindings = defineRouteBindings({
    series: SeriesModel,
    chapter: ChapterModel,
});

export default defineRoutes([
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'series',
        path: '/:series',
        component: Series,
    },
    {
        name: 'chapter',
        path: '/:series/:chapter',
        component: Chapter,
    },
]);
