<template>
    <div v-if="route.name === 'reader'" class="h-full w-full">
        <router-view />
    </div>
    <AppLayout v-else>
        <AppHeader />
        <router-view />
    </AppLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
