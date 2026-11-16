import { stringToSlug, urlParentDirectory, urlRoute, uuid } from '@noeldemartin/utils';
import type { HasOneRelation, MintUrlOptions } from 'soukai-bis';

import Model from './Chapter.schema';
import type Series from './Series';

export default class Chapter extends Model {
    public static cloud = true;

    declare public readonly series?: Series;
    declare public readonly relatedSeries: HasOneRelation<this, Series, typeof Series>;

    public static slugFromUrl(url: string): string | null {
        const languageContainerUrl = urlParentDirectory(urlRoute(url));
        const chapterContainerUrl = languageContainerUrl && urlParentDirectory(languageContainerUrl);

        return chapterContainerUrl && super.slugFromUrl(chapterContainerUrl);
    }

    protected newUrlDocumentUrl(options: MintUrlOptions = {}): string {
        if (!this.series?.getContainerUrl()) {
            return super.newUrlDocumentUrl(options);
        }

        const slug = stringToSlug(this.number) || uuid();
        const language = this.language ?? 'en';

        return `${this.series.requireContainerUrl()}${slug}${options.slugSuffix ?? ''}/${language}/index`;
    }
}
