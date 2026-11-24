import { arraySorted } from '@noeldemartin/utils';
import { InvalidationStrategies, belongsToMany, defineSchema, hasOne, isContainedBy, loaded } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'ComicIssue',
    history: true,
    fields: {
        number: z.string().rdfProperty('issueNumber'),
        language: z.string().rdfProperty('inLanguage').default('en'),
        externalUrls: z.array(z.url()).default([]).rdfProperty('sameAs'),
    },
    relations: {
        series: hasOne('Series', 'chapterUrls'),
        container: isContainedBy('Container'),
        translations: belongsToMany('Chapter', 'externalUrls'),
        mainVersion: hasOne('Chapter', 'externalUrls'),
    },
    computed: {
        pageUrls: {
            invalidationStrategy: InvalidationStrategies.Container,
            compute: (chapter): string[] => arraySorted(loaded(chapter, 'container')?.fileUrls ?? []),
        },
    },
});
