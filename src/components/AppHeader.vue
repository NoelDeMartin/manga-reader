<template>
    <header
        v-if="showHeader"
        class="max-w-screen-content px-edge mx-auto flex w-full items-center justify-between gap-2 pt-8"
    >
        <h1>
            <Link route="home" class="text-2xl font-semibold tracking-tight">
                {{ $t('app.title') }}
            </Link>
        </h1>
        <div class="grow" />
        <ErrorLogs />
        <Account />
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showHeader = computed(() => {
    if (route.matched.length === 0) {
        return false;
    }

    return route.meta.showHeader ?? true;
});
</script>
