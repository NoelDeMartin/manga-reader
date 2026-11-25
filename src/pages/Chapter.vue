<template>
    <ChapterReader
        :series-name="series.name"
        :chapter-number="activeChapter.number"
        :series-route="seriesRoute"
        :pages="pages"
        :languages="languageOptions"
        :active-language="activeChapter.language"
        :uploading="uploading"
        :previous-chapter="previousChapter"
        :next-chapter="nextChapter"
        @switch-language="switchLanguage"
        @upload="uploadPages"
    />
</template>

<script setup lang="ts">
import { useLoading } from '@aerogel/core';
import { computedModelAttribute } from '@aerogel/reactivity';
import { isLocalUrl, type ModelWithUrl } from 'soukai-bis';
import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ChapterReader from '@/components/reader/ChapterReader.vue';
import type { ReaderChapterLink, ReaderLanguageOption } from '@/components/reader/types';
import type Chapter from '@/models/Chapter';
import type Series from '@/models/Series';
import { renderLanguage } from '@/utils/languages';

const { series, chapter } = defineProps<{ series: ModelWithUrl<Series>; chapter: ModelWithUrl<Chapter> }>();
const route = useRoute();
const router = useRouter();
const { loading: uploading, run: runUploading } = useLoading({ delay: 200 });

const availableLanguages = computed(() => [chapter, ...(chapter.translations ?? [])]);
const languageOptions = computed<ReaderLanguageOption[]>(() =>
    availableLanguages.value.map((item) => ({
        code: item.language,
        label: renderLanguage(item.language),
    })),
);

const activeChapter = computed(() => {
    const language = typeof route.query.language === 'string' ? route.query.language : null;

    return (language && chapter.translations?.find((translation) => translation.language === language)) || chapter;
});

const pages = computedModelAttribute(() => activeChapter.value, 'pageUrls');

const seriesRoute = computed(() => ({
    name: 'series',
    params: { series: series.requireSlug() },
    query: isLocalUrl(series.url) ? undefined : { url: series.url },
}));

const sortedChapters = computed(() =>
    [...(series.chapters ?? [])].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
);

const currentChapterIndex = computed(() => sortedChapters.value.findIndex((item) => item.url === chapter.url));

const previousChapter = computed<ReaderChapterLink | null>(() => {
    const prev = currentChapterIndex.value > 0 ? sortedChapters.value[currentChapterIndex.value - 1] : null;

    if (!prev) {
        return null;
    }

    return {
        number: prev.number,
        to: prev.route,
    };
});

const nextChapter = computed<ReaderChapterLink | null>(() => {
    const next =
        currentChapterIndex.value >= 0 && currentChapterIndex.value < sortedChapters.value.length - 1
            ? sortedChapters.value[currentChapterIndex.value + 1]
            : null;

    if (!next) {
        return null;
    }

    return {
        number: next.number,
        to: next.route,
    };
});

async function switchLanguage(language: string) {
    const target = availableLanguages.value.find((c) => c.language === language);

    if (!target || target.language === activeChapter.value.language) {
        return;
    }

    const { language: _, ...query } = route.query;

    await router.push({
        name: 'chapter',
        params: route.params,
        query: target === chapter ? query : { ...query, language: target.language },
    });
}

async function uploadPages(files: File[]) {
    if (files.length === 0) {
        return;
    }

    await runUploading(uploadFiles(files));
}

async function uploadFiles(files: File[]) {
    await activeChapter.value.loadRelationIfUnloaded('container');

    for (const file of files) {
        await activeChapter.value.relatedContainer.uploadFile(file);
    }
}

watchEffect(async () => {
    await Promise.all([
        chapter.loadRelationIfUnloaded('series'),
        chapter.loadRelationIfUnloaded('translations'),
        series.loadRelationIfUnloaded('chapters'),
    ]);
});
</script>
