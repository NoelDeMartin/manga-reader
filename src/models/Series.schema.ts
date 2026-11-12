import { defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfClass: 'http://schema.org/Series',
    history: true,
    fields: {
        name: z.string().useAsSlug(),
    },
});
