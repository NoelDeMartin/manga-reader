<template>
    <nav
        v-if="totalPages > 0"
        :aria-label="$t('reader.pageSlider')"
        :class="[
            'fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md transition-all duration-200',
            visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
            theme === 'dark'
                ? 'border-white/10 bg-neutral-950/88 text-neutral-100'
                : 'border-neutral-200 bg-white/88 text-neutral-900',
        ]"
    >
        <div class="mx-auto flex h-14 max-w-screen-xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
            <div class="flex shrink-0 items-center gap-1">
                <RouterLink
                    v-if="leftChapter"
                    :to="leftChapter.to"
                    :aria-label="isRtl ? $t('reader.nextChapter') : $t('reader.previousChapter')"
                    :title="
                        (isRtl ? $t('reader.nextChapter') : $t('reader.previousChapter')) + ` (${leftChapter.number})`
                    "
                    :class="navButtonClass"
                >
                    <i-lucide-chevrons-left class="size-4" />
                </RouterLink>

                <button
                    type="button"
                    :disabled="leftActionDisabled"
                    :aria-label="isRtl ? $t('reader.nextPage') : $t('reader.previousPage')"
                    :title="isRtl ? $t('reader.nextPage') : $t('reader.previousPage')"
                    :class="navButtonClass"
                    @click="isRtl ? $emit('next') : $emit('previous')"
                >
                    <i-lucide-chevron-left class="size-5" />
                </button>
            </div>

            <div class="flex min-w-0 grow items-center gap-3">
                <input
                    type="range"
                    :min="1"
                    :max="totalPages"
                    :value="currentPage + 1"
                    :dir="isRtl && mode !== 'vertical' ? 'rtl' : 'ltr'"
                    :aria-label="$t('reader.pageSlider')"
                    :aria-valuemin="1"
                    :aria-valuemax="totalPages"
                    :aria-valuenow="currentPage + 1"
                    :class="[
                        'h-1.5 w-full cursor-pointer appearance-none rounded-full transition-colors focus:outline-none focus-visible:ring-2',
                        theme === 'dark'
                            ? 'bg-white/20 accent-white focus-visible:ring-white/50'
                            : 'bg-neutral-300 accent-neutral-900 focus-visible:ring-neutral-900/40',
                    ]"
                    @input="onSliderInput"
                />

                <div class="flex shrink-0 items-center gap-2">
                    <span class="font-mono text-xs font-medium tabular-nums sm:text-sm">
                        {{ pageRangeLabel }} / {{ totalPages }}
                    </span>

                    <span
                        v-if="mode !== 'vertical'"
                        :class="[
                            'hidden rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase sm:inline-block',
                            theme === 'dark' ? 'bg-white/10 text-neutral-300' : 'bg-neutral-200 text-neutral-700',
                        ]"
                    >
                        {{ isRtl ? $t('reader.direction.rtlShort') : $t('reader.direction.ltrShort') }}
                    </span>
                </div>
            </div>

            <div class="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    :disabled="rightActionDisabled"
                    :aria-label="isRtl ? $t('reader.previousPage') : $t('reader.nextPage')"
                    :title="isRtl ? $t('reader.previousPage') : $t('reader.nextPage')"
                    :class="navButtonClass"
                    @click="isRtl ? $emit('previous') : $emit('next')"
                >
                    <i-lucide-chevron-right class="size-5" />
                </button>

                <RouterLink
                    v-if="rightChapter"
                    :to="rightChapter.to"
                    :aria-label="isRtl ? $t('reader.previousChapter') : $t('reader.nextChapter')"
                    :title="
                        (isRtl ? $t('reader.previousChapter') : $t('reader.nextChapter')) + ` (${rightChapter.number})`
                    "
                    :class="navButtonClass"
                >
                    <i-lucide-chevrons-right class="size-4" />
                </RouterLink>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { ReaderChapterLink, ReaderTheme, ReadingDirection, ReadingMode } from './types';

const props = withDefaults(
    defineProps<{
        currentPage: number;
        secondaryPage?: number | null;
        totalPages: number;
        mode: ReadingMode;
        direction: ReadingDirection;
        theme: ReaderTheme;
        visible?: boolean;
        previousChapter?: ReaderChapterLink | null;
        nextChapter?: ReaderChapterLink | null;
    }>(),
    {
        secondaryPage: null,
        visible: true,
        previousChapter: null,
        nextChapter: null,
    },
);

const emit = defineEmits<{
    previous: [];
    next: [];
    goTo: [pageIndex: number];
}>();

const isRtl = computed(() => props.direction === 'rtl' && props.mode !== 'vertical');
const canGoPrevious = computed(() => props.currentPage > 0);
const canGoNext = computed(() => {
    const lastVisiblePage = props.secondaryPage ?? props.currentPage;

    return lastVisiblePage < props.totalPages - 1;
});

const leftActionDisabled = computed(() => (isRtl.value ? !canGoNext.value : !canGoPrevious.value));
const rightActionDisabled = computed(() => (isRtl.value ? !canGoPrevious.value : !canGoNext.value));
const leftChapter = computed(() => (isRtl.value ? props.nextChapter : props.previousChapter));
const rightChapter = computed(() => (isRtl.value ? props.previousChapter : props.nextChapter));

const pageRangeLabel = computed(() => {
    if (props.secondaryPage !== null && props.secondaryPage !== props.currentPage) {
        return `${props.currentPage + 1}–${props.secondaryPage + 1}`;
    }

    return `${props.currentPage + 1}`;
});

const navButtonClass = computed(() => [
    'inline-flex size-9 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-30',
    props.theme === 'dark'
        ? 'text-neutral-200 hover:bg-white/10 hover:text-white focus-visible:ring-white/40'
        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-neutral-900/30',
]);

function onSliderInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const pageIndex = Number(target.value) - 1;

    if (!Number.isNaN(pageIndex)) {
        emit('goTo', pageIndex);
    }
}
</script>
