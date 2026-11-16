<template>
    <Page :title="`${series.name}, ${chapter.number}`">
        <template v-if="pages?.length">
            <Select v-model="selectedPage" :options="pages" />
            <SolidImage v-if="selectedPage" :src="selectedPage" />
        </template>
        <i-svg-spinners-180-ring v-else-if="!pages" class="size-10" />
        <p v-else class="text-center text-gray-500">{{ $t('chapters.noPages') }}</p>
    </Page>
</template>

<script setup lang="ts">
import { Solid } from '@aerogel/plugin-solid';
import { arraySorted, isTruthy } from '@noeldemartin/utils';
import { Container, remote, type ModelWithUrl } from 'soukai-bis';
import { ref, watchEffect } from 'vue';

import type Chapter from '@/models/Chapter';
import type Series from '@/models/Series';

const { chapter } = defineProps<{ series: ModelWithUrl<Series>; chapter: ModelWithUrl<Chapter> }>();
const pages = ref<string[] | null>(null);
const selectedPage = ref<string | null>(null);

watchEffect(async () => {
    if (!Solid.isLoggedIn()) {
        pages.value = [];

        return;
    }

    const container = await remote(Container).findOrFail(chapter.requireContainerUrl());
    const resources = await container.loadRelationIfUnloaded('resources');

    pages.value = arraySorted(
        resources
            .map((resource) => resource.url)
            .filter(isTruthy)
            .filter((url) => !url.endsWith('/')),
    );
});
</script>
