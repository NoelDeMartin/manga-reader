<template>
    <header
        :class="[
            'fixed inset-x-0 top-0 z-30 border-b backdrop-blur-md transition-all duration-200',
            visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
            settings.theme === 'dark'
                ? 'border-white/10 bg-neutral-950/88 text-neutral-100'
                : 'border-neutral-200 bg-white/88 text-neutral-900',
        ]"
    >
        <div class="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-2 px-3 sm:px-4">
            <div class="flex min-w-0 items-center gap-2 sm:gap-3">
                <component
                    :is="seriesRoute ? 'RouterLink' : 'button'"
                    :to="seriesRoute || undefined"
                    :type="seriesRoute ? undefined : 'button'"
                    :aria-label="$t('reader.backToSeries', { series: seriesName })"
                    :title="$t('reader.backToSeries', { series: seriesName })"
                    :class="iconButtonClass"
                    @click="!seriesRoute && $emit('back')"
                >
                    <i-lucide-arrow-left class="size-5" />
                </component>

                <div class="min-w-0">
                    <h1 class="flex items-baseline gap-1.5 truncate text-sm font-semibold sm:text-base">
                        <span class="truncate">{{ seriesName }}</span>
                        <span
                            :class="[
                                'shrink-0 font-normal',
                                settings.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
                            ]"
                        >
                            ·
                        </span>
                        <span class="shrink-0">
                            <span class="hidden sm:inline">{{
                                $t('reader.chapterLabel', { number: chapterNumber })
                            }}</span>
                            <span class="sm:hidden">{{ $t('reader.chapterShort', { number: chapterNumber }) }}</span>
                        </span>
                    </h1>
                </div>
            </div>

            <div class="flex shrink-0 items-center gap-1 sm:gap-1.5">
                <div v-if="languages.length > 1" class="relative flex items-center">
                    <i-lucide-languages
                        aria-hidden="true"
                        :class="[
                            'pointer-events-none absolute left-2.5 size-4',
                            settings.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
                        ]"
                    />
                    <select
                        :value="activeLanguage"
                        :aria-label="$t('chapters.language')"
                        :class="[
                            'h-9 cursor-pointer appearance-none rounded-lg border py-1 pr-7 pl-8 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 sm:text-sm',
                            settings.theme === 'dark'
                                ? 'border-white/15 bg-white/5 text-neutral-100 hover:bg-white/10 focus-visible:ring-white/40'
                                : 'border-neutral-300 bg-neutral-50 text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-900/30',
                        ]"
                        @change="onLanguageChange"
                    >
                        <option
                            v-for="lang in languages"
                            :key="lang.code"
                            :value="lang.code"
                            :class="
                                settings.theme === 'dark'
                                    ? 'bg-neutral-900 text-neutral-100'
                                    : 'bg-white text-neutral-900'
                            "
                        >
                            {{ lang.label }}
                        </option>
                    </select>
                    <i-lucide-chevron-down
                        aria-hidden="true"
                        :class="[
                            'pointer-events-none absolute right-2 size-3.5',
                            settings.theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500',
                        ]"
                    />
                </div>

                <label
                    :class="[
                        'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-within:ring-2 sm:text-sm',
                        uploading && 'pointer-events-none opacity-60',
                        settings.theme === 'dark'
                            ? 'text-neutral-200 focus-within:ring-white/40 hover:bg-white/10 hover:text-white'
                            : 'text-neutral-700 focus-within:ring-neutral-900/30 hover:bg-neutral-100 hover:text-neutral-950',
                    ]"
                    :title="$t('chapters.uploadPages')"
                >
                    <i-svg-spinners-180-ring v-if="uploading" class="size-4" />
                    <i-lucide-image-plus v-else class="size-4" />
                    <span class="hidden md:inline">{{ $t('chapters.uploadPages') }}</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        :disabled="uploading"
                        :aria-label="$t('chapters.uploadPages')"
                        class="sr-only"
                        @change="onFileChange"
                    />
                </label>

                <div class="relative">
                    <button
                        type="button"
                        data-reader-settings-trigger
                        :aria-label="$t('reader.settings')"
                        :aria-expanded="settingsOpen"
                        aria-haspopup="dialog"
                        :title="$t('reader.settings')"
                        :class="[
                            iconButtonClass,
                            settingsOpen &&
                                (settings.theme === 'dark'
                                    ? 'bg-white/15 text-white'
                                    : 'bg-neutral-200 text-neutral-950'),
                        ]"
                        @click="$emit('update:settingsOpen', !settingsOpen)"
                    >
                        <i-lucide-sliders-horizontal class="size-4" />
                    </button>

                    <Transition
                        enter-active-class="transition duration-150 ease-out"
                        enter-from-class="translate-y-1 opacity-0 scale-95"
                        enter-to-class="translate-y-0 opacity-100 scale-100"
                        leave-active-class="transition duration-100 ease-in"
                        leave-from-class="translate-y-0 opacity-100 scale-100"
                        leave-to-class="translate-y-1 opacity-0 scale-95"
                    >
                        <ReaderSettingsMenu
                            v-if="settingsOpen"
                            :settings="settings"
                            class="absolute top-11 right-0 z-40"
                            @update:settings="$emit('update:settings', $event)"
                            @close="$emit('update:settingsOpen', false)"
                        />
                    </Transition>
                </div>

                <button
                    v-if="canFullscreen"
                    type="button"
                    :aria-label="isFullscreen ? $t('reader.exitFullscreen') : $t('reader.fullscreen')"
                    :title="isFullscreen ? $t('reader.exitFullscreen') : $t('reader.fullscreen')"
                    :class="iconButtonClass"
                    @click="$emit('toggleFullscreen')"
                >
                    <i-lucide-minimize v-if="isFullscreen" class="size-4" />
                    <i-lucide-maximize v-else class="size-4" />
                </button>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import ReaderSettingsMenu from './ReaderSettingsMenu.vue';
import type { ReaderLanguageOption, ReaderSettings } from './types';

const props = withDefaults(
    defineProps<{
        seriesName: string;
        chapterNumber: string;
        seriesRoute?: RouteLocationRaw | null;
        languages?: ReaderLanguageOption[];
        activeLanguage?: string;
        uploading?: boolean;
        visible?: boolean;
        settings: ReaderSettings;
        settingsOpen?: boolean;
        isFullscreen?: boolean;
        canFullscreen?: boolean;
    }>(),
    {
        seriesRoute: null,
        languages: () => [],
        activeLanguage: '',
        uploading: false,
        visible: true,
        settingsOpen: false,
        isFullscreen: false,
        canFullscreen: true,
    },
);

const emit = defineEmits<{
    back: [];
    switchLanguage: [language: string];
    upload: [files: File[]];
    'update:settings': [settings: ReaderSettings];
    'update:settingsOpen': [open: boolean];
    toggleFullscreen: [];
}>();

const iconButtonClass = computed(() => [
    'inline-flex size-9 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2',
    props.settings.theme === 'dark'
        ? 'text-neutral-200 hover:bg-white/10 hover:text-white focus-visible:ring-white/40'
        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-neutral-900/30',
]);

function onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;

    if (select.value) {
        emit('switchLanguage', select.value);
    }
}

function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    input.value = '';

    if (files.length > 0) {
        emit('upload', files);
    }
}
</script>
