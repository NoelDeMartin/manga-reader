import { defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';

import Series from '@/models/Series.ts';

import Home from './Home.vue';
import SeriesShow from './SeriesShow.vue';

export const bindings = defineRouteBindings({ series: Series });

export default defineRoutes([
    {
        name: 'home',
        path: '/',
        component: Home,
    },
    {
        name: 'series.show',
        path: '/series/:series',
        component: SeriesShow,
    },
]);
