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
        const mainVersion = this.mainVersion ?? this;
        const series = required(mainVersion.series);
        const query: Record<string, string> = {};
        const params = {
            series: series.requireSlug(),
            chapter: mainVersion.requireSlug(),
        };

        if (this.mainVersion) {
            query.language = this.language;
        }

        if (series.url && !isLocalUrl(series.url)) {
            query.seriesUrl = series.url;
        }

        if (mainVersion.url && !isLocalUrl(mainVersion.url)) {
            query.url = mainVersion.url;
        }

        return {
            name: 'chapter',
            params,
            query,
        };
    }

    public async createTranslation(language: string): Promise<Chapter> {
        return this.relatedTranslations.create({
            number: this.number,
            language,
        });
    }

    protected newUrlDocumentUrl(options: MintUrlOptions = {}): string {
        const language = this.language ?? 'en';
        const mainVersionContainerUrl = this.mainVersion?.getContainerUrl();
        const chapterContainerUrl = mainVersionContainerUrl && urlParentDirectory(mainVersionContainerUrl);

        if (chapterContainerUrl) {
            return `${chapterContainerUrl}${language}${options.slugSuffix ?? ''}/index`;
        }

        if (!this.series?.getContainerUrl()) {
            return super.newUrlDocumentUrl(options);
        }

        const slug = stringToSlug(this.number) || uuid();

        return `${this.series.requireContainerUrl()}${slug}${options.slugSuffix ?? ''}/${language}/index`;
    }
}
