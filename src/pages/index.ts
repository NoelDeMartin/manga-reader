import { defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';

import SeriesModel from '@/models/Series.ts';

import Chapter from './Chapter.vue';
import Home from './Home.vue';
import Series from './Series.vue';

export const bindings = defineRouteBindings({
    series: SeriesModel,

    // TODO
    // chapter(...args) {
    //     console.log(args);

    //     return bindingNotFound('foo');
    // },
});

export default defineRoutes([
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'series',
        path: '/series/:series',
        component: Series,
    },
    {
        name: 'chapter',
        path: '/series/:series/:chapter',
        component: Chapter,
    },
]);
