<template>
    <Page :title="series.name">
        <Form :form class="flex items-start gap-2" @submit="runCreating(createChapter())">
            <Input
                name="number"
                :placeholder="$t('chapters.number')"
                :aria-label="$t('chapters.number')"
                class="grow"
            />
            <Combobox
                name="language"
                :aria-label="$t('chapters.language')"
                :options="LANGUAGES"
                :render-option="renderLanguage"
            />
            <Button submit :disabled="creating" :loading="creating">
                {{ $t('chapters.create') }}
            </Button>
        </Form>

        <ul v-if="series.chapters?.length" class="divide-y divide-gray-200 dark:divide-gray-800">
            <li
                v-for="chapter of series.chapters"
                :key="chapter.url"
                class="flex items-center gap-2 py-2 text-gray-900 dark:text-gray-100"
            >
                <Link :to="chapter.route">
                    {{ chapter.number }}
                </Link>
                <div class="flex items-center gap-1">
                    <Link
                        v-for="translation of [chapter, ...(chapter.translations ?? [])]"
                        :key="translation.url"
                        :to="translation.route"
                        class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        {{ renderLanguage(translation.language) }}
                    </Link>
                </div>
            </li>
        </ul>
        <p v-else class="text-gray-500">
            {{ $t('chapters.noChapters') }}
        </p>
    </Page>
</template>

<script setup lang="ts">
import { useForm, useLoading } from '@aerogel/core';
import { type ModelWithUrl } from 'soukai-bis';
import { watchEffect } from 'vue';
import { z } from 'zod';

import type Series from '@/models/Series';
import { LANGUAGES, renderLanguage } from '@/utils/languages';

const { series } = defineProps<{ series: ModelWithUrl<Series> }>();
const { loading: creating, run: runCreating } = useLoading({ delay: 200 });
const form = useForm({
    number: z.string(),
    language: z.string().default('en'),
});

async function createChapter() {
    await series.loadRelationIfUnloaded('chapters');

    const existingChapter = series.chapters?.find((chapter) => chapter.number === form.number);

    if (existingChapter) {
        await existingChapter.loadRelationIfUnloaded('translations');

        const alreadyExists =
            existingChapter.language === form.language ||
            existingChapter.translations?.some((translation) => translation.language === form.language);

        if (!alreadyExists) {
            await existingChapter.createTranslation(form.language);
        }
    } else {
        await series.relatedChapters.create({ number: form.number, language: form.language });
    }

    form.reset();
}

watchEffect(async () => {
    await series.loadRelationIfUnloaded('chapters');

    await Promise.all((series.chapters ?? []).map((chapter) => chapter.loadRelationIfUnloaded('translations')));
});
</script>
