<template>
    <Page :title="series.name">
        <Form :form class="flex items-start gap-2" @submit="runCreating(createChapter())">
            <Input
                name="number"
                :placeholder="$t('chapters.number')"
                :aria-label="$t('chapters.number')"
                class="grow"
            />
            <Button submit :disabled="creating" :loading="creating">
                {{ $t('chapters.create') }}
            </Button>
        </Form>

        <ul v-if="series.chapters?.length" class="divide-y divide-gray-200 dark:divide-gray-800">
            <li v-for="chapter of series.chapters" :key="chapter.url" class="py-2 text-gray-900 dark:text-gray-100">
                <Link
                    route="chapter"
                    :route-params="{
                        series: series.requireSlug(),
                        chapter: chapter.requireSlug(),
                    }"
                    :route-query="!chapter.url || isLocalUrl(chapter.url) ? undefined : { url: chapter.url }"
                >
                    {{ chapter.number }}
                </Link>
            </li>
        </ul>
        <p v-else class="text-gray-500">
            {{ $t('chapters.noChapters') }}
        </p>
    </Page>
</template>

<script setup lang="ts">
import { useForm, useLoading } from '@aerogel/core';
import { isLocalUrl, type ModelWithUrl } from 'soukai-bis';
import { watchEffect } from 'vue';
import { z } from 'zod';

import type Series from '@/models/Series';

const { series } = defineProps<{ series: ModelWithUrl<Series> }>();
const { loading: creating, run: runCreating } = useLoading({ delay: 200 });
const form = useForm({ number: z.string() });

async function createChapter() {
    await series.loadRelationIfUnloaded('chapters');
    await series.relatedChapters.create({ number: form.number });

    form.reset();
}

watchEffect(async () => {
    await series.loadRelationIfUnloaded('chapters');
});
</script>
