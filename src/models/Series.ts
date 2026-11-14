import { urlParentDirectory, urlRoute } from '@noeldemartin/utils';
import type { UrlFromSlugOptions } from 'soukai-bis';

import Model from './Series.schema';

export default class Series extends Model {
    public static cloud = {
        path: 'manga',
        depth: 1,
    };

    public static documentUrlFromSlug(slug: string, options: UrlFromSlugOptions = {}): string {
        return super.documentUrlFromSlug(`${slug}/info`, options);
    }

    public static slugFromUrl(url: string): string | null {
        return super.slugFromUrl(urlParentDirectory(urlRoute(url)) ?? url);
    }
}
