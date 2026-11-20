import { cloudRegistration } from '@aerogel/plugin-local-first';

import Model from './Series.schema';

export default class Series extends Model {
    public static cloud = cloudRegistration({
        path: 'manga',
        depth: 1,
    });
}
