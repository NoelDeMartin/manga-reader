import { defineRoutes } from '@aerogel/plugin-routing';

import Home from './Home.vue';
import MangaDetails from './MangaDetails.vue';
import Reader from './Reader.vue';
import EditChapter from './EditChapter.vue';

export default defineRoutes([
    { name: 'home', path: '/', component: Home },
    { name: 'manga-details', path: '/manga/:id', component: MangaDetails },
    { name: 'edit-chapter', path: '/manga/:mangaId/chapter/:chapterId/edit', component: EditChapter },
    { name: 'reader', path: '/read/:chapterId', component: Reader },
]);
