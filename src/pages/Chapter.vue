<template>
    <Page :title="`${series.name}, ${chapter?.number}`">
        <template v-if="pages">
            <Select v-model="selectedPage" :options="pages" />
            <SolidImage v-if="selectedPage" :src="selectedPage" />
        </template>
        <i-svg-spinners-180-ring v-else class="size-10" />
    </Page>
</template>

<script setup lang="ts">
import { arraySorted, isTruthy } from '@noeldemartin/utils';
import { remote, type ModelWithUrl } from 'soukai-bis';
import { Container } from 'soukai-bis';
import { computed, onMounted, ref, watch } from 'vue';

import type Series from '@/models/Series';

const { series, chapter: chapterNumber } = defineProps<{ series: ModelWithUrl<Series>; chapter: string }>();
const chapter = computed(() => series.chapters?.find((chapter) => chapter.number === chapterNumber));
const pages = ref<string[] | null>(null);
const selectedPage = ref<string | null>(null);

onMounted(() => series.loadRelationIfUnloaded('chapters'));

watch(
    chapter,
    async () => {
        if (!chapter.value) {
            pages.value = null;

            return;
        }

        const container = await remote(Container).findOrFail(chapter.value.requireContainerUrl());
        const resources = await container.loadRelationIfUnloaded('resources');

        pages.value = arraySorted(
            resources
                .map((resource) => resource.url)
                .filter(isTruthy)
                .filter((url) => !url.endsWith('/')),
        );
    },
    { immediate: true },
);
</script>
