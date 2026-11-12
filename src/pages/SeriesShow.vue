<template>
    <Page :title="series.name" />
</template>

<script setup lang="ts">
import type Series from '@/models/Series.ts';

defineProps<{ series: Series }>();
</script>
