import { belongsToMany, defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'ComicSeries',
    history: true,
    fields: {
        name: z.string().useAsContainerSlug(),
        chapterUrls: z.array(z.url()).default([]).rdfProperty('hasPart'),
    },
    relations: {
        chapters: belongsToMany('Chapter', 'chapterUrls'),
    },
});
