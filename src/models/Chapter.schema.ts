import { arraySorted } from '@noeldemartin/utils';
import { InvalidationStrategies, defineSchema, hasOne, isContainedBy, loaded } from 'soukai-bis';
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
        container: isContainedBy('Container'),
    },
    computed: {
        pageUrls: {
            invalidationStrategy: InvalidationStrategies.Container,
            compute: (chapter): string[] => arraySorted(loaded(chapter, 'container')?.fileUrls ?? []),
        },
    },
});
