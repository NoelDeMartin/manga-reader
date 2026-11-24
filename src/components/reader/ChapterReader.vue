<template>
    <div
        ref="rootRef"
        :class="[
            'relative flex h-dvh w-full flex-col overflow-hidden transition-colors',
            settings.theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900',
        ]"
    >
        <ReaderToolbar
            :series-name="seriesName"
            :chapter-number="chapterNumber"
            :series-route="seriesRoute"
            :languages="languages"
            :active-language="activeLanguage"
            :uploading="uploading"
            :visible="effectiveControlsVisible"
            :settings="settings"
            :settings-open="settingsOpen"
            :is-fullscreen="isFullscreen"
            :can-fullscreen="canFullscreen"
            @back="$emit('back')"
            @switch-language="$emit('switchLanguage', $event)"
            @upload="$emit('upload', $event)"
            @update:settings="updateSettings"
            @update:settings-open="settingsOpen = $event"
            @toggle-fullscreen="toggleFullscreen"
        />

        <ReaderCanvas
            ref="canvasRef"
            :pages="pages"
            :current-page="currentPage"
            :secondary-page="secondaryPage"
            :chapter-number="chapterNumber"
            :series-route="seriesRoute"
            :next-chapter="nextChapter"
            :settings="settings"
            :uploading="uploading"
            :controls-visible="effectiveControlsVisible"
            @previous="goPrevious"
            @next="goNext"
            @toggle-controls="toggleControls"
            @update:current-page="currentPage = $event"
            @upload="$emit('upload', $event)"
        />

        <ReaderNavigationBar
            :current-page="currentPage"
            :secondary-page="secondaryPage"
            :total-pages="pages?.length ?? 0"
            :mode="settings.mode"
            :direction="settings.direction"
            :theme="settings.theme"
            :visible="effectiveControlsVisible"
            :previous-chapter="previousChapter"
            :next-chapter="nextChapter"
            @previous="goPrevious"
            @next="goNext"
            @go-to="goToPage"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import ReaderCanvas from './ReaderCanvas.vue';
import ReaderNavigationBar from './ReaderNavigationBar.vue';
import ReaderToolbar from './ReaderToolbar.vue';
import type { ReaderChapterLink, ReaderLanguageOption, ReaderSettings } from './types';

const SETTINGS_STORAGE_KEY = 'manga-reader:settings';

const DEFAULT_SETTINGS: ReaderSettings = {
    mode: 'single',
    direction: 'rtl',
    fit: 'contain',
    theme: 'dark',
};

const props = withDefaults(
    defineProps<{
        seriesName: string;
        chapterNumber: string;
        seriesRoute?: RouteLocationRaw | null;
        pages?: string[];
        languages?: ReaderLanguageOption[];
        activeLanguage?: string;
        uploading?: boolean;
        previousChapter?: ReaderChapterLink | null;
        nextChapter?: ReaderChapterLink | null;
        initialSettings?: Partial<ReaderSettings>;
        persistSettings?: boolean;
    }>(),
    {
        seriesRoute: null,
        pages: undefined,
        languages: () => [],
        activeLanguage: '',
        uploading: false,
        previousChapter: null,
        nextChapter: null,
        initialSettings: undefined,
        persistSettings: true,
    },
);

defineEmits<{
    back: [];
    switchLanguage: [language: string];
    upload: [files: File[]];
}>();

function loadStoredSettings(): ReaderSettings {
    if (!props.persistSettings || typeof window === 'undefined') {
        return { ...DEFAULT_SETTINGS, ...props.initialSettings };
    }

    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

        if (!raw) {
            return { ...DEFAULT_SETTINGS, ...props.initialSettings };
        }

        const parsed = JSON.parse(raw) as Partial<ReaderSettings>;

        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            ...props.initialSettings,
        };
    } catch {
        return { ...DEFAULT_SETTINGS, ...props.initialSettings };
    }
}

const rootRef = ref<HTMLElement | null>(null);
const canvasRef = ref<InstanceType<typeof ReaderCanvas> | null>(null);
const settings = ref<ReaderSettings>(loadStoredSettings());
const currentPage = ref(0);
const controlsVisible = ref(true);
const settingsOpen = ref(false);
const isFullscreen = ref(false);
const isWideViewport = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

const canFullscreen = computed(() => typeof document !== 'undefined' && Boolean(document.fullscreenEnabled));

const isDoubleActive = computed(() => settings.value.mode === 'double' && isWideViewport.value);

const pageStep = computed(() => (isDoubleActive.value ? 2 : 1));

const secondaryPage = computed<number | null>(() => {
    if (!isDoubleActive.value) {
        return null;
    }

    const total = props.pages?.length ?? 0;

    return currentPage.value + 1 < total ? currentPage.value + 1 : null;
});

const effectiveControlsVisible = computed(() => {
    if (!props.pages?.length || props.uploading || settingsOpen.value) {
        return true;
    }

    return controlsVisible.value;
});

function updateSettings(next: ReaderSettings) {
    settings.value = next;

    if (props.persistSettings && typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Ignore storage quota errors
        }
    }
}

function clampPage(index: number): number {
    const total = props.pages?.length ?? 0;

    if (total === 0) {
        return 0;
    }

    return Math.max(0, Math.min(index, total - 1));
}

function goToPage(index: number) {
    const target = clampPage(index);

    currentPage.value = target;
    canvasRef.value?.scrollToPage(target);
}

function goNext() {
    const total = props.pages?.length ?? 0;

    if (total === 0) {
        return;
    }

    const nextIndex = currentPage.value + pageStep.value;

    if (nextIndex < total) {
        goToPage(nextIndex);
    }
}

function goPrevious() {
    if (currentPage.value <= 0) {
        return;
    }

    goToPage(Math.max(0, currentPage.value - pageStep.value));
}

function toggleControls() {
    if (settingsOpen.value) {
        settingsOpen.value = false;

        return;
    }

    controlsVisible.value = !controlsVisible.value;
}

async function toggleFullscreen() {
    if (!canFullscreen.value || !rootRef.value) {
        return;
    }

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await rootRef.value.requestFullscreen();
        }
    } catch {
        // Ignore fullscreen permission errors
    }
}

function handleFullscreenChange() {
    isFullscreen.value = Boolean(document.fullscreenElement);
}

function handleResize() {
    isWideViewport.value = window.innerWidth >= 768;
}

function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;

    if (
        target &&
        (target.tagName === 'INPUT' ||
            target.tagName === 'SELECT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
    ) {
        return;
    }

    const isRtl = settings.value.direction === 'rtl';

    switch (event.key) {
        case 'ArrowLeft':
            if (settings.value.mode !== 'vertical') {
                event.preventDefault();

                if (isRtl) {
                    goNext();
                } else {
                    goPrevious();
                }
            }
            break;

        case 'ArrowRight':
            if (settings.value.mode !== 'vertical') {
                event.preventDefault();

                if (isRtl) {
                    goPrevious();
                } else {
                    goNext();
                }
            }
            break;

        case ' ':
            if (settings.value.mode !== 'vertical') {
                event.preventDefault();

                if (event.shiftKey) {
                    goPrevious();
                } else {
                    goNext();
                }
            }
            break;

        case 'PageDown':
            if (settings.value.mode !== 'vertical') {
                event.preventDefault();
                goNext();
            }
            break;

        case 'PageUp':
            if (settings.value.mode !== 'vertical') {
                event.preventDefault();
                goPrevious();
            }
            break;

        case 'Home':
            event.preventDefault();
            goToPage(0);
            break;

        case 'End':
            event.preventDefault();
            goToPage((props.pages?.length ?? 1) - 1);
            break;

        case 'h':
        case 'H':
            event.preventDefault();
            toggleControls();
            break;

        case 'f':
        case 'F':
            event.preventDefault();
            toggleFullscreen();
            break;

        case 'Escape':
            if (settingsOpen.value) {
                settingsOpen.value = false;
            } else if (!controlsVisible.value) {
                controlsVisible.value = true;
            }
            break;
    }
}

watch(
    () => props.pages,
    (nextPages) => {
        if (!nextPages?.length) {
            currentPage.value = 0;

            return;
        }

        if (currentPage.value >= nextPages.length) {
            currentPage.value = 0;
        }
    },
);

watch(
    () => props.chapterNumber,
    () => {
        currentPage.value = 0;
    },
);

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>
