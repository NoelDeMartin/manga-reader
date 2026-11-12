<template>
    <Page>
        <div class="flex flex-col gap-6">
            <Form :form class="flex items-start gap-2" @submit="runCreating(createSeries())">
                <Input name="name" :placeholder="$t('series.name')" :aria-label="$t('series.name')" class="grow" />
                <Button submit :disabled="creating" :loading="creating">
                    {{ $t('series.create') }}
                </Button>
            </Form>

            <ul v-if="series.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
                <li v-for="item in series" :key="item.url" class="py-2 text-gray-900 dark:text-gray-100">
                    <Link
                        route="series.show"
                        :route-params="{ series: item.requireSlug() }"
                        :route-query="isLocalUrl(item.url) ? undefined : { url: item.url }"
                    >
                        {{ item.name }}
                    </Link>
                </li>
            </ul>
            <p v-else class="text-gray-500">
                {{ $t('series.noSeries') }}
            </p>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { useForm, useLoading } from '@aerogel/core';
import { useModels } from '@aerogel/plugin-solid';
import { isLocalUrl } from 'soukai-bis';
import { z } from 'zod';

import Series from '@/models/Series';

const { models: series } = useModels(Series);
const { loading: creating, run: runCreating } = useLoading({ delay: 200 });
const form = useForm({ name: z.string() });

async function createSeries() {
    await Series.create({ name: form.name });

    form.reset();
}
</script>
