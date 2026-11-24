<template>
    <div
        ref="menuRef"
        role="dialog"
        :aria-label="$t('reader.settings')"
        :class="[
            'w-72 rounded-xl border p-4 shadow-2xl backdrop-blur-xl transition-colors sm:w-80',
            theme === 'dark'
                ? 'border-white/10 bg-neutral-900/95 text-neutral-100'
                : 'border-neutral-200 bg-white/95 text-neutral-900',
        ]"
    >
        <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold tracking-tight">{{ $t('reader.settings') }}</h2>
            <button
                type="button"
                :aria-label="$t('reader.closeSettings')"
                :class="[
                    'rounded-lg p-1 transition-colors',
                    theme === 'dark'
                        ? 'text-neutral-400 hover:bg-white/10 hover:text-white'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
                ]"
                @click="$emit('close')"
            >
                <i-lucide-x class="size-4" />
            </button>
        </div>

        <div class="flex flex-col gap-4">
            <fieldset class="flex flex-col gap-1.5">
                <legend :class="['text-xs font-medium', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500']">
                    {{ $t('reader.mode.label') }}
                </legend>
                <div
                    :class="[
                        'grid grid-cols-3 gap-1 rounded-lg p-1',
                        theme === 'dark' ? 'bg-white/5' : 'bg-neutral-100',
                    ]"
                >
                    <button
                        v-for="option in modeOptions"
                        :key="option.value"
                        type="button"
                        :aria-pressed="settings.mode === option.value"
                        :class="segmentButtonClass(settings.mode === option.value)"
                        @click="update('mode', option.value)"
                    >
                        <component :is="option.icon" class="size-4" />
                        <span>{{ option.label }}</span>
                    </button>
                </div>
            </fieldset>

            <fieldset v-if="settings.mode !== 'vertical'" class="flex flex-col gap-1.5">
                <legend :class="['text-xs font-medium', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500']">
                    {{ $t('reader.direction.label') }}
                </legend>
                <div
                    :class="[
                        'grid grid-cols-2 gap-1 rounded-lg p-1',
                        theme === 'dark' ? 'bg-white/5' : 'bg-neutral-100',
                    ]"
                >
                    <button
                        v-for="option in directionOptions"
                        :key="option.value"
                        type="button"
                        :aria-pressed="settings.direction === option.value"
                        :class="segmentButtonClass(settings.direction === option.value)"
                        @click="update('direction', option.value)"
                    >
                        <component :is="option.icon" class="size-4" />
                        <span>{{ option.label }}</span>
                    </button>
                </div>
            </fieldset>

            <fieldset v-if="settings.mode !== 'vertical'" class="flex flex-col gap-1.5">
                <legend :class="['text-xs font-medium', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500']">
                    {{ $t('reader.fit.label') }}
                </legend>
                <div
                    :class="[
                        'grid grid-cols-2 gap-1 rounded-lg p-1',
                        theme === 'dark' ? 'bg-white/5' : 'bg-neutral-100',
                    ]"
                >
                    <button
                        v-for="option in fitOptions"
                        :key="option.value"
                        type="button"
                        :aria-pressed="settings.fit === option.value"
                        :class="segmentButtonClass(settings.fit === option.value)"
                        @click="update('fit', option.value)"
                    >
                        <component :is="option.icon" class="size-4" />
                        <span>{{ option.label }}</span>
                    </button>
                </div>
            </fieldset>

            <fieldset class="flex flex-col gap-1.5">
                <legend :class="['text-xs font-medium', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500']">
                    {{ $t('reader.theme.label') }}
                </legend>
                <div
                    :class="[
                        'grid grid-cols-2 gap-1 rounded-lg p-1',
                        theme === 'dark' ? 'bg-white/5' : 'bg-neutral-100',
                    ]"
                >
                    <button
                        v-for="option in themeOptions"
                        :key="option.value"
                        type="button"
                        :aria-pressed="settings.theme === option.value"
                        :class="segmentButtonClass(settings.theme === option.value)"
                        @click="update('theme', option.value)"
                    >
                        <component :is="option.icon" class="size-4" />
                        <span>{{ option.label }}</span>
                    </button>
                </div>
            </fieldset>
        </div>

        <p
            :class="[
                'mt-4 hidden border-t pt-3 text-[11px] sm:block',
                theme === 'dark' ? 'border-white/10 text-neutral-400' : 'border-neutral-200 text-neutral-500',
            ]"
        >
            {{ $t('reader.shortcuts') }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import IconArrowLeftToLine from '~icons/lucide/arrow-left-to-line';
import IconArrowRightToLine from '~icons/lucide/arrow-right-to-line';
import IconBookOpen from '~icons/lucide/book-open';
import IconMaximize2 from '~icons/lucide/maximize-2';
import IconMoon from '~icons/lucide/moon';
import IconMoveHorizontal from '~icons/lucide/move-horizontal';
import IconRows3 from '~icons/lucide/rows-3';
import IconSquare from '~icons/lucide/square';
import IconSun from '~icons/lucide/sun';

import type { PageFit, ReaderSettings, ReaderTheme, ReadingDirection, ReadingMode } from './types';

const props = defineProps<{
    settings: ReaderSettings;
}>();

const emit = defineEmits<{
    'update:settings': [settings: ReaderSettings];
    close: [];
}>();

const { t } = useI18n();
const menuRef = ref<HTMLElement | null>(null);
const theme = computed(() => props.settings.theme);

const modeOptions = computed<Array<{ value: ReadingMode; label: string; icon: unknown }>>(() => [
    { value: 'single', label: t('reader.mode.single'), icon: IconSquare },
    { value: 'double', label: t('reader.mode.double'), icon: IconBookOpen },
    { value: 'vertical', label: t('reader.mode.vertical'), icon: IconRows3 },
]);

const directionOptions = computed<Array<{ value: ReadingDirection; label: string; icon: unknown }>>(() => [
    { value: 'rtl', label: t('reader.direction.rtl'), icon: IconArrowLeftToLine },
    { value: 'ltr', label: t('reader.direction.ltr'), icon: IconArrowRightToLine },
]);

const fitOptions = computed<Array<{ value: PageFit; label: string; icon: unknown }>>(() => [
    { value: 'contain', label: t('reader.fit.contain'), icon: IconMaximize2 },
    { value: 'width', label: t('reader.fit.width'), icon: IconMoveHorizontal },
]);

const themeOptions = computed<Array<{ value: ReaderTheme; label: string; icon: unknown }>>(() => [
    { value: 'dark', label: t('reader.theme.dark'), icon: IconMoon },
    { value: 'light', label: t('reader.theme.light'), icon: IconSun },
]);

function update<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) {
    emit('update:settings', {
        ...props.settings,
        [key]: value,
    });
}

function segmentButtonClass(active: boolean): string[] {
    const base =
        'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors';

    if (active) {
        return [
            base,
            theme.value === 'dark' ? 'bg-white text-neutral-950 shadow-sm' : 'bg-neutral-900 text-white shadow-sm',
        ];
    }

    return [
        base,
        theme.value === 'dark'
            ? 'text-neutral-300 hover:bg-white/10 hover:text-white'
            : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900',
    ];
}

function handlePointerDown(event: PointerEvent) {
    if (!menuRef.value) {
        return;
    }

    const target = event.target as HTMLElement | null;

    if (target && !menuRef.value.contains(target) && !target.closest('[data-reader-settings-trigger]')) {
        emit('close');
    }
}

onMounted(() => {
    window.addEventListener('pointerdown', handlePointerDown);
});

onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', handlePointerDown);
});
</script>
