import { defineSchema, hasOne } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfClass: 'https://schema.org/ComicIssue',
    rdfContext: 'https://schema.org/',
    history: true,
    fields: {
        number: z.string().rdfProperty('issueNumber').useAsSlug(),
        language: z.string().rdfProperty('inLanguage').default('en'),
    },
    relations: {
        series: hasOne('Series', 'chapterUrls'),
    },
});
