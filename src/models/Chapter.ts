import { uuid } from '@noeldemartin/utils';
import type { HasOneRelation, MintUrlOptions } from 'soukai-bis';

import Model from './Chapter.schema';
import type Series from './Series';

export default class Chapter extends Model {
    public static cloud = true;

    declare public readonly series?: Series;
    declare public readonly relatedSeries: HasOneRelation<this, Series, typeof Series>;

    protected newUrlDocumentUrl(options: MintUrlOptions = {}): string {
        if (!this.series?.getContainerUrl()) {
            return super.newUrlDocumentUrl(options);
        }

        const slug = this.newUrlSlug() ?? uuid();
        const language = this.language ?? 'en';

        // TODO on conflict, add shortId to slug

        return `${this.series.requireContainerUrl()}${slug}${options.slugSuffix ?? ''}/${language}/index`;
    }
}
