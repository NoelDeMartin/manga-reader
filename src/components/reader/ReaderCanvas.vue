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
                'relative flex h-full w-full justify-center',
                settings.fit === 'contain' ? 'items-center overflow-hidden' : 'items-start overflow-y-auto py-14',
            ]"
            @click="onPagedCanvasClick"
            @touchstart.passive="onTouchStart"
            @touchend.passive="onTouchEnd"
        >
            <div
                :class="[
                    'flex items-center justify-center transition-[padding] duration-200',
                    settings.fit === 'contain'
                        ? ['h-full w-full px-1 sm:px-4', controlsVisible ? 'py-16' : 'py-2']
                        : 'w-full max-w-5xl px-2',
                    displayedPages.length > 1 ? 'gap-0.5' : '',
                ]"
            >
                <SolidImage
                    v-for="item in displayedPages"
                    :key="item.url"
                    :src="item.url"
                    :alt="$t('reader.pageAlt', { page: item.index + 1, total: pages.length })"
                    :class="pagedImageClass"
                    draggable="false"
                />
            </div>

            <!-- Preload adjacent pages silently -->
            <div aria-hidden="true" class="pointer-events-none fixed size-px overflow-hidden opacity-0">
                <SolidImage v-for="url in preloadUrls" :key="`preload-${url}`" :src="url" alt="" />
            </div>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { ReaderChapterLink, ReaderSettings } from './types';

const props = withDefaults(
    defineProps<{
        pages?: string[];
        currentPage: number;
        secondaryPage?: number | null;
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

const canvasRef = ref<HTMLElement | null>(null);
const verticalScrollRef = ref<HTMLElement | null>(null);
const pagedContainerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
let dragCounter = 0;
let touchStartX = 0;
let touchStartY = 0;

const verticalPageElements = new Map<number, HTMLElement>();
let intersectionObserver: IntersectionObserver | null = null;
let suppressObserverUntil = 0;

const displayedPages = computed(() => {
    const pages = props.pages ?? [];
    const primaryUrl = pages[props.currentPage];

    if (!primaryUrl) {
        return [];
    }

    const primary = { index: props.currentPage, url: primaryUrl };

    if (props.secondaryPage === null || props.secondaryPage === props.currentPage) {
        return [primary];
    }

    const secondaryUrl = pages[props.secondaryPage];

    if (!secondaryUrl) {
        return [primary];
    }

    const secondary = { index: props.secondaryPage, url: secondaryUrl };

    return props.settings.direction === 'rtl' ? [secondary, primary] : [primary, secondary];
});

const preloadUrls = computed(() => {
    const pages = props.pages ?? [];

    if (pages.length <= 1 || props.settings.mode === 'vertical') {
        return [];
    }

    const shown = new Set(displayedPages.value.map((item) => item.url));
    const candidates = new Set([
        pages[props.currentPage - 1],
        pages[props.currentPage + 1],
        pages[props.currentPage + 2],
        pages[props.currentPage + 3],
    ]);

    return Array.from(candidates).filter((url): url is string => Boolean(url && !shown.has(url)));
});

const pagedImageClass = computed(() => {
    const isDouble = displayedPages.value.length > 1;

    if (props.settings.fit === 'contain') {
        return ['object-contain select-none', isDouble ? 'max-h-full max-w-[50%]' : 'max-h-full max-w-full'];
    }

    return ['h-auto select-none', isDouble ? 'w-1/2' : 'w-full max-w-4xl'];
});

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

function onPagedCanvasClick(event: MouseEvent) {
    const container = pagedContainerRef.value;

    if (!container) {
        return;
    }

    const rect = container.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;

    if (ratio < 0.3) {
        if (props.settings.direction === 'rtl') {
            emit('next');
        } else {
            emit('previous');
        }
    } else if (ratio > 0.7) {
        if (props.settings.direction === 'rtl') {
            emit('previous');
        } else {
            emit('next');
        }
    } else {
        emit('toggleControls');
    }
}

function onTouchStart(event: TouchEvent) {
    const touch = event.changedTouches[0];

    if (!touch) {
        return;
    }

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0];

    if (!touch) {
        return;
    }

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
    }

    // Swiping left means moving finger right-to-left
    if (deltaX < 0) {
        if (props.settings.direction === 'rtl') {
            emit('previous');
        } else {
            emit('next');
        }
    } else if (props.settings.direction === 'rtl') {
        emit('next');
    } else {
        emit('previous');
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
        nextTick(() => {
            setupIntersectionObserver();

            if (mode === 'vertical' && previousMode !== 'vertical' && props.currentPage > 0) {
                scrollToPage(props.currentPage);
            }
        });
    },
);

watch(
    () => [props.chapterNumber, props.pages],
    () => {
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
