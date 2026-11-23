<template>
    <Page :title="`${series.name}, ${chapter.number}`">
        <div class="flex flex-col gap-4">
            <label class="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span class="flex items-center gap-2">
                    <span>{{ $t('chapters.uploadPages') }}</span>
                    <i-svg-spinners-180-ring v-if="uploading" class="size-4" />
                </span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    :disabled="uploading"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-200 dark:hover:file:bg-gray-700"
                    @change="uploadPages"
                />
            </label>

            <template v-if="pages?.length">
                <Select v-model="selectedPage" :options="pages" />
                <SolidImage v-if="selectedPage" :src="selectedPage" />
            </template>
            <i-svg-spinners-180-ring v-else-if="!pages" class="size-10" />
            <p v-else class="text-center text-gray-500">{{ $t('chapters.noPages') }}</p>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { useLoading } from '@aerogel/core';
import { computedModelAttribute } from '@aerogel/reactivity';
import type { ModelWithUrl } from 'soukai-bis';
import { ref, watchEffect } from 'vue';

import type Chapter from '@/models/Chapter';
import type Series from '@/models/Series';

const { chapter } = defineProps<{ series: ModelWithUrl<Series>; chapter: ModelWithUrl<Chapter> }>();
const { loading: uploading, run: runUploading } = useLoading({ delay: 200 });
const pages = computedModelAttribute(() => chapter, 'pageUrls');
const selectedPage = ref<string | null>(null);

async function uploadPages(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: File[] = Array.from(input.files ?? []);

    input.value = '';

    if (files.length === 0) {
        return;
    }

    await runUploading(uploadFiles(files));
}

async function uploadFiles(files: File[]) {
    await chapter.loadRelationIfUnloaded('container');

    for (const file of files) {
        await chapter.relatedContainer.uploadFile(file);
    }
}

watchEffect(() => {
    selectedPage.value ??= pages.value?.[0] ?? null;
});
</script>
