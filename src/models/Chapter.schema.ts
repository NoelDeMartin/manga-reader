import { defineSchema, hasOne } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'ComicIssue',
    history: true,
    fields: {
        number: z.string().rdfProperty('issueNumber'),
        language: z.string().rdfProperty('inLanguage').default('en'),
    },
    relations: {
        series: hasOne('Series', 'chapterUrls'),
    },
});
