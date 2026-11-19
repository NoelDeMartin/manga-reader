import { FilesStrategies } from '@aerogel/plugin-local-first';
import { stringToSlug, urlParentDirectory, urlRoute, uuid } from '@noeldemartin/utils';
import type { MintUrlOptions } from 'soukai-bis';

import Model from './Chapter.schema';

export default class Chapter extends Model {
    public static cloud = {
        files: FilesStrategies.Container,
    };

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
