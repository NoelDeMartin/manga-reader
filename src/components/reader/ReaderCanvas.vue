<template>
    <main
        ref="canvasRef"
        class="relative flex h-full w-full flex-col overflow-hidden select-none"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <!-- Drag and drop overlay -->
        <div
            v-if="isDragging"
            class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/75 p-6 backdrop-blur-sm"
        >
            <div
                class="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/50 bg-neutral-900/90 px-10 py-8 text-center text-white shadow-2xl"
            >
                <i-lucide-upload class="size-10 text-white/90" />
                <p class="text-base font-medium">{{ $t('reader.dropToUpload') }}</p>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="pages === undefined" class="flex h-full flex-col items-center justify-center gap-3 p-6">
            <i-svg-spinners-180-ring
                :class="['size-10', settings.theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700']"
            />
            <p :class="['text-sm', settings.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600']">
                {{ $t('reader.loadingPages') }}
            </p>
        </div>

        <!-- Empty state -->
        <div v-else-if="pages.length === 0" class="flex h-full items-center justify-center p-6">
            <div
                :class="[
                    'flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-8 text-center',
                    settings.theme === 'dark'
                        ? 'border-white/10 bg-neutral-900/70 text-neutral-100'
                        : 'border-neutral-200 bg-white text-neutral-900 shadow-sm',
                ]"
            >
                <div
                    :class="[
                        'flex size-14 items-center justify-center rounded-full',
                        settings.theme === 'dark' ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-600',
                    ]"
                >
                    <i-lucide-book-open class="size-7" />
                </div>

                <div class="flex flex-col gap-1.5">
                    <p class="text-base font-semibold">{{ $t('chapters.noPages') }}</p>
                    <p :class="['text-sm', settings.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500']">
                        {{ $t('reader.uploadHint') }}
                    </p>
                </div>

                <label
                    :class="[
                        'mt-1 inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-within:ring-2',
                        uploading && 'pointer-events-none opacity-60',
                        settings.theme === 'dark'
                            ? 'bg-white text-neutral-950 focus-within:ring-white/50 hover:bg-neutral-200'
                            : 'bg-neutral-900 text-white focus-within:ring-neutral-900/40 hover:bg-neutral-800',
                    ]"
                >
                    <i-svg-spinners-180-ring v-if="uploading" class="size-4" />
                    <i-lucide-upload v-else class="size-4" />
                    <span>{{ uploading ? $t('reader.uploading') : $t('chapters.uploadPages') }}</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        :disabled="uploading"
                        class="sr-only"
                        @change="onEmptyFileChange"
                    />
                </label>
            </div>
        </div>

        <!-- Vertical strip mode -->
        <div
            v-else-if="settings.mode === 'vertical'"
            ref="verticalScrollRef"
            class="h-full w-full overflow-y-auto pt-14 pb-20"
            @click="$emit('toggleControls')"
        >
            <div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-1 px-0 sm:px-4">
                <div
                    v-for="(pageUrl, index) in pages"
                    :key="`${index}-${pageUrl}`"
                    :ref="(el) => setVerticalPageRef(el as HTMLElement | null, index)"
                    :data-page-index="index"
                    class="w-full"
                >
                    <SolidImage
                        :src="pageUrl"
                        :alt="$t('reader.pageAlt', { page: index + 1, total: pages.length })"
                        class="block h-auto w-full"
                        loading="lazy"
                    />
                </div>

                <div
                    :class="[
                        'my-10 flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-6 text-center',
                        settings.theme === 'dark'
                            ? 'border-white/10 bg-neutral-900/70 text-neutral-100'
                            : 'border-neutral-200 bg-white text-neutral-900 shadow-sm',
                    ]"
                    @click.stop
                >
                    <p class="text-sm font-medium">{{ $t('reader.endOfChapter', { number: chapterNumber }) }}</p>
                    <div class="flex flex-wrap items-center justify-center gap-2">
                        <RouterLink
                            v-if="nextChapter"
                            :to="nextChapter.to"
                            :class="[
                                'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                                settings.theme === 'dark'
                                    ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                                    : 'bg-neutral-900 text-white hover:bg-neutral-800',
                            ]"
                        >
                            <span>{{ $t('reader.nextChapter') }} ({{ nextChapter.number }})</span>
                            <i-lucide-arrow-right class="size-4" />
                        </RouterLink>
                        <RouterLink
                            v-if="seriesRoute"
                            :to="seriesRoute"
                            :class="[
                                'inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                                settings.theme === 'dark'
                                    ? 'border-white/15 text-neutral-200 hover:bg-white/10'
                                    : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100',
                            ]"
                        >
                            <span>{{ $t('reader.backToSeriesAction') }}</span>
                        </RouterLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Paged modes (Single & Double) -->
        <div
            v-else
            ref="pagedContainerRef"
            :class="[
                'relative flex h-full w-full touch-pinch-zoom justify-center',
                settings.fit === 'contain'
                    ? [
                          'items-center overflow-hidden px-1 transition-[padding] duration-200 sm:px-4',
                          controlsVisible ? 'py-16' : 'py-2',
                      ]
                    : 'touch-pan-y items-start overflow-x-hidden overflow-y-auto px-2 py-14',
                isPointerDragging ? 'cursor-grabbing' : 'cursor-grab',
            ]"
            @click="onCanvasClick"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerCancel"
            @pointerleave="onPointerLeave"
            @lostpointercapture="onLostPointerCapture"
        >
            <div
                ref="spreadFrameRef"
                :class="[
                    'relative overflow-hidden',
                    settings.fit === 'contain'
                        ? 'h-full w-fit max-w-full'
                        : ['w-full', pageStep > 1 ? 'max-w-5xl' : 'max-w-4xl'],
                ]"
            >
                <div
                    :class="[
                        'relative w-full',
                        settings.fit === 'contain' && 'h-full',
                        isAnimating && 'transition-transform duration-200 ease-out',
                    ]"
                    :style="trackStyle"
                    @transitionend="onTrackTransitionEnd"
                >
                    <div
                        v-for="spread in visibleSpreads"
                        :key="spread.startIndex"
                        :aria-hidden="spread.slot !== 0 ? 'true' : undefined"
                        :class="getSpreadSlotClass(spread.slot)"
                        :style="getSpreadSlotStyle(spread.slot)"
                    >
                        <div :class="getSpreadInnerClass(spread.items.length)">
                            <SolidImage
                                v-for="item in spread.items"
                                :key="`${item.index}-${item.url}`"
                                :src="item.url"
                                :alt="
                                    spread.slot === 0
                                        ? $t('reader.pageAlt', { page: item.index + 1, total: pages.length })
                                        : ''
                                "
                                :class="getSpreadImageClass(spread.items.length)"
                                decoding="async"
                                draggable="false"
                                @load="onSpreadImageLoad"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { type NavigationAction, useReaderDrag } from './composables/useReaderDrag';
import type { ReaderChapterLink, ReaderSettings } from './types';

const props = withDefaults(
    defineProps<{
        pages?: string[];
        currentPage: number;
        secondaryPage?: number | null;
        pageStep?: number;
        chapterNumber: string;
        seriesRoute?: RouteLocationRaw | null;
        nextChapter?: ReaderChapterLink | null;
        settings: ReaderSettings;
        uploading?: boolean;
        controlsVisible?: boolean;
    }>(),
    {
        pages: undefined,
        secondaryPage: null,
        pageStep: 1,
        seriesRoute: null,
        nextChapter: null,
        uploading: false,
        controlsVisible: true,
    },
);

const emit = defineEmits<{
    previous: [];
    next: [];
    toggleControls: [];
    'update:currentPage': [pageIndex: number];
    upload: [files: File[]];
}>();

const PRELOAD_SPREADS_RADIUS = 3;

const canvasRef = ref<HTMLElement | null>(null);
const verticalScrollRef = ref<HTMLElement | null>(null);
const pagedContainerRef = ref<HTMLElement | null>(null);
const spreadFrameRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

let dragCounter = 0;

const verticalPageElements = new Map<number, HTMLElement>();
let intersectionObserver: IntersectionObserver | null = null;
let suppressObserverUntil = 0;

interface SpreadItem {
    index: number;
    url: string;
}

interface VisibleSpread {
    startIndex: number;
    slot: number;
    items: SpreadItem[];
}

function buildSpread(startIndex: number, includeSecondary: boolean): SpreadItem[] {
    const pages = props.pages ?? [];
    const primaryUrl = pages[startIndex];

    if (!primaryUrl) {
        return [];
    }

    const primary: SpreadItem = { index: startIndex, url: primaryUrl };

    if (!includeSecondary) {
        return [primary];
    }

    const secondaryIndex = startIndex + 1;
    const secondaryUrl = pages[secondaryIndex];

    if (!secondaryUrl) {
        return [primary];
    }

    const secondary: SpreadItem = { index: secondaryIndex, url: secondaryUrl };

    return props.settings.direction === 'rtl' ? [secondary, primary] : [primary, secondary];
}

const displayedPages = computed(() => {
    const hasSecondary = props.secondaryPage !== null && props.secondaryPage !== props.currentPage;

    return buildSpread(props.currentPage, hasSecondary);
});

const visibleSpreads = computed<VisibleSpread[]>(() => {
    const total = props.pages?.length ?? 0;

    if (total === 0) {
        return [];
    }

    const spreads: VisibleSpread[] = [];
    const seen = new Set<number>();
    const isRtl = props.settings.direction === 'rtl';

    function addSpread(startIndex: number, slot: number, items: SpreadItem[]): boolean {
        if (seen.has(startIndex) || items.length === 0) {
            return false;
        }

        seen.add(startIndex);
        spreads.push({ startIndex, slot, items });

        return true;
    }

    addSpread(props.currentPage, 0, displayedPages.value);

    let previousStart = props.currentPage;

    for (let step = 1; step <= PRELOAD_SPREADS_RADIUS && previousStart > 0; step++) {
        previousStart = Math.max(0, previousStart - props.pageStep);

        if (!addSpread(previousStart, isRtl ? step : -step, buildSpread(previousStart, props.pageStep > 1))) {
            break;
        }
    }

    for (let step = 1; step <= PRELOAD_SPREADS_RADIUS; step++) {
        const nextStart = props.currentPage + props.pageStep * step;

        if (nextStart >= total) {
            break;
        }

        if (!addSpread(nextStart, isRtl ? -step : step, buildSpread(nextStart, props.pageStep > 1))) {
            break;
        }
    }

    return spreads.sort((a, b) => a.startIndex - b.startIndex);
});

const canGoPrevious = computed(() => props.currentPage > 0);
const canGoNext = computed(() => props.currentPage + props.pageStep < (props.pages?.length ?? 0));

const {
    isPointerDragging,
    isAnimating,
    dragScrollTop,
    trackStyle,
    onCanvasClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onLostPointerCapture,
    onTrackTransitionEnd,
    resetDrag,
    handleExternalPageChange,
} = useReaderDrag({
    containerRef: pagedContainerRef,
    frameRef: spreadFrameRef,
    direction: () => props.settings.direction,
    canGoPrevious: () => canGoPrevious.value,
    canGoNext: () => canGoNext.value,
    onNavigate: (action: NavigationAction) => {
        if (action === 'next') {
            emit('next');
        } else {
            emit('previous');
        }
    },
    onToggleControls: () => emit('toggleControls'),
});

function onSpreadImageLoad(event: Event) {
    const img = event.target as HTMLImageElement | null;

    if (img && typeof img.decode === 'function') {
        img.decode().catch(() => {});
    }
}

function getSpreadSlotPositionClass(slot: number): string {
    if (slot === -1) {
        return 'right-full';
    }

    if (slot === 1) {
        return 'left-full';
    }

    return slot < -1 ? 'right-[200%] opacity-0' : 'left-[200%] opacity-0';
}

function getSpreadSlotClass(slot: number) {
    const isContain = props.settings.fit === 'contain';

    if (slot === 0) {
        return ['flex w-full justify-center', isContain ? 'h-full items-center' : 'items-start'];
    }

    const isPreloadBuffer = Math.abs(slot) > 1;

    return [
        'pointer-events-none absolute flex w-full justify-center',
        isContain ? 'inset-y-0 items-center' : ['items-start', isPreloadBuffer && 'max-h-dvh overflow-hidden'],
        getSpreadSlotPositionClass(slot),
    ];
}

function getSpreadSlotStyle(slot: number) {
    if (slot === 0 || props.settings.fit !== 'width') {
        return undefined;
    }

    return { top: Math.abs(slot) === 1 ? `${dragScrollTop.value}px` : '0px' };
}

function getSpreadInnerClass(count: number) {
    if (props.settings.fit === 'contain') {
        return ['flex h-full w-fit max-w-full items-center justify-center', count > 1 ? 'gap-0.5' : ''];
    }

    return ['flex w-full items-start justify-center', count > 1 ? 'gap-0.5' : ''];
}

function getSpreadImageClass(count: number) {
    const isDouble = count > 1;

    if (props.settings.fit === 'contain') {
        return ['object-contain select-none', isDouble ? 'max-h-full max-w-[50%]' : 'max-h-full max-w-full'];
    }

    return ['h-auto select-none', isDouble ? 'w-1/2' : 'w-full'];
}

function setVerticalPageRef(el: HTMLElement | null, index: number) {
    const existing = verticalPageElements.get(index);

    if (existing && intersectionObserver) {
        intersectionObserver.unobserve(existing);
    }

    if (el) {
        verticalPageElements.set(index, el);
        intersectionObserver?.observe(el);
    } else {
        verticalPageElements.delete(index);
    }
}

function setupIntersectionObserver() {
    intersectionObserver?.disconnect();
    intersectionObserver = null;

    if (props.settings.mode !== 'vertical' || !verticalScrollRef.value) {
        return;
    }

    intersectionObserver = new IntersectionObserver(
        (entries) => {
            if (Date.now() < suppressObserverUntil) {
                return;
            }

            let bestIndex: number | null = null;
            let bestRatio = 0;

            for (const entry of entries) {
                if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
                    const idx = Number((entry.target as HTMLElement).dataset.pageIndex);

                    if (!Number.isNaN(idx)) {
                        bestRatio = entry.intersectionRatio;
                        bestIndex = idx;
                    }
                }
            }

            if (bestIndex !== null && bestIndex !== props.currentPage) {
                emit('update:currentPage', bestIndex);
            }
        },
        {
            root: verticalScrollRef.value,
            threshold: [0.25, 0.5, 0.75],
        },
    );

    for (const el of verticalPageElements.values()) {
        intersectionObserver.observe(el);
    }
}

function scrollToPage(pageIndex: number) {
    if (props.settings.mode === 'vertical') {
        const el = verticalPageElements.get(pageIndex);

        if (el) {
            suppressObserverUntil = Date.now() + 600;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return;
    }

    if (pagedContainerRef.value) {
        pagedContainerRef.value.scrollTop = 0;
    }
}

function onEmptyFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    input.value = '';

    if (files.length > 0) {
        emit('upload', files);
    }
}

function onDragEnter(event: DragEvent) {
    if (!event.dataTransfer?.types.includes('Files')) {
        return;
    }

    dragCounter += 1;
    isDragging.value = true;
}

function onDragLeave() {
    dragCounter = Math.max(0, dragCounter - 1);

    if (dragCounter === 0) {
        isDragging.value = false;
    }
}

function onDrop(event: DragEvent) {
    dragCounter = 0;
    isDragging.value = false;

    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith('image/'));

    if (files.length > 0) {
        emit('upload', files);
    }
}

function resetScroll() {
    suppressObserverUntil = Date.now() + 300;

    if (verticalScrollRef.value) {
        verticalScrollRef.value.scrollTop = 0;
    }

    if (pagedContainerRef.value) {
        pagedContainerRef.value.scrollTop = 0;
    }
}

watch(
    () => [props.settings.mode, props.pages?.length] as const,
    ([mode], [previousMode]) => {
        resetDrag(false);

        nextTick(() => {
            setupIntersectionObserver();

            if (mode === 'vertical' && previousMode !== 'vertical' && props.currentPage > 0) {
                scrollToPage(props.currentPage);
            }
        });
    },
);

watch(
    () => props.currentPage,
    () => {
        handleExternalPageChange();
    },
);

watch(
    () => props.settings.direction,
    () => {
        resetDrag(false);
    },
);

watch(
    () => [props.chapterNumber, props.pages],
    () => {
        resetDrag(false);
        nextTick(resetScroll);
    },
);

onMounted(() => {
    setupIntersectionObserver();
});

onBeforeUnmount(() => {
    intersectionObserver?.disconnect();
});

defineExpose({ scrollToPage, resetScroll });
</script>
