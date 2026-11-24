import { cloudRegistration } from '@aerogel/plugin-local-first';
import { required, stringToSlug, urlParentDirectory, urlRoute, uuid } from '@noeldemartin/utils';
import { FilesSyncStrategies, isLocalUrl, type MintUrlOptions } from 'soukai-bis';
import type { RouteLocationRaw } from 'vue-router';

import Model from './Chapter.schema';

export default class Chapter extends Model {
    public static cloud = cloudRegistration({
        files: FilesSyncStrategies.Container,
    });

    public static slugFromUrl(url: string): string | null {
        const languageContainerUrl = urlParentDirectory(urlRoute(url));
        const chapterContainerUrl = languageContainerUrl && urlParentDirectory(languageContainerUrl);

        return chapterContainerUrl && super.slugFromUrl(chapterContainerUrl);
    }

    public get route(): RouteLocationRaw {
        const series = required(this.series);
        const query: Record<string, string> = {};
        const params = {
            series: series.requireSlug(),
            chapter: this.requireSlug(),
        };

        if (series.url && !isLocalUrl(series.url)) {
            query.seriesUrl = series.url;
        }

        if (this.url && !isLocalUrl(this.url)) {
            query.url = this.url;
        }

        return {
            name: 'chapter',
            params,
            query,
        };
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
