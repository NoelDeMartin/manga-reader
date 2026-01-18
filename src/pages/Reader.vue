<template>
    <div v-if="chapter && manga" class="relative flex min-h-screen flex-col bg-black text-white">
        <!-- Top Bar -->
        <div
            class="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-black/80 p-4 backdrop-blur-sm transition-opacity duration-300"
            :class="{ 'opacity-0 hover:opacity-100': immersiveMode }"
        >
            <router-link
                :to="{ name: 'manga-details', params: { id: manga.id } }"
                class="hover:text-primary-400 flex items-center gap-2 text-sm font-medium"
            >
                &larr; Back to {{ manga.title }}
            </router-link>

            <!-- Language Switcher -->
            <div v-if="availableLanguages.length > 1" class="flex items-center gap-2">
                <select
                    v-model="currentLanguage"
                    class="focus:border-primary-500 rounded border border-gray-600 bg-gray-800 p-1 text-xs text-white outline-none"
                    @click.stop
                >
                    <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                        {{ lang.toUpperCase() }}
                    </option>
                </select>
            </div>

            <div class="text-sm text-gray-400">
                Chapter {{ chapter.number }} <span class="uppercase">[{{ currentLanguage }}]</span>: Page
                {{ currentPageIndex + 1 }} / {{ currentPages.length }}
            </div>
        </div>

        <!-- Reader Area -->
        <div
            class="flex flex-grow items-center justify-center py-0 pb-12 md:py-12"
            @click="toggleImmersive"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
        >
            <div class="relative h-full w-full max-w-3xl">
                <!-- Navigation Zones -->
                <div
                    class="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
                    title="Previous Page"
                    @click.stop="prevPage"
                />
                <div
                    class="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize"
                    title="Next Page"
                    @click.stop="nextPage"
                />

                <!-- Image -->
                <img
                    v-if="currentPage"
                    :src="currentPage.url"
                    alt="Manga Page"
                    class="h-auto w-full select-none"
                >
            </div>
        </div>

        <!-- Bottom Controls (Mobile mainly) -->
        <div
            v-if="!immersiveMode"
            class="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between bg-black/80 p-4 backdrop-blur-sm md:hidden"
        >
            <button class="p-2 text-white disabled:opacity-50" :disabled="currentPageIndex === 0" @click="prevPage">
                Prev
            </button>
            <span class="text-xs">{{ currentPageIndex + 1 }} / {{ currentPages.length }}</span>
            <button
                class="p-2 text-white disabled:opacity-50"
                :disabled="currentPageIndex === currentPages.length - 1"
                @click="nextPage"
            >
                Next
            </button>
        </div>
    </div>
    <div v-else class="flex h-screen items-center justify-center text-white">
        Chapter not found.
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMangaStore } from '@/composables/useMangaStore';

const route = useRoute();
const router = useRouter();
const chapterId = route.params.chapterId as string;
const { mangas } = useMangaStore();

const manga = computed(() => mangas.value.find((m) => m.chapters.some((c) => c.id === chapterId)));
const chapter = computed(() => manga.value?.chapters.find((c) => c.id === chapterId));

const currentPageIndex = ref(0);
const immersiveMode = ref(false);

const availableLanguages = computed(() => {
    return chapter.value ? Object.keys(chapter.value.pages) : [];
});

// Initialize language from route, or fallback
const currentLanguage = ref((route.query.lang as string) || availableLanguages.value[0] || 'en');

// Sync language from route updates (e.g. browser back button)
watch(
    () => route.query.lang,
    (newLang) => {
        if (newLang && typeof newLang === 'string') {
            currentLanguage.value = newLang;
        }
    },
);

// Update route when dropdown changes
watch(currentLanguage, (newLang) => {
    if (newLang !== route.query.lang) {
        router.replace({ ...route, query: { ...route.query, lang: newLang } });
        // Try to keep the same page index, clamp if new version has fewer pages
        if (currentPages.value.length > 0) {
            currentPageIndex.value = Math.min(currentPageIndex.value, currentPages.value.length - 1);
        } else {
            currentPageIndex.value = 0;
        }
    }
});

const currentPages = computed(() => {
    if (!chapter.value) return [];
    // Fallback to first available if selected language doesn't exist
    const pages = chapter.value.pages[currentLanguage.value];
    if (pages) return pages;

    // Fallback strategy
    const firstLang = availableLanguages.value[0];
    if (firstLang) return chapter.value.pages[firstLang];

    return [];
});

const currentPage = computed(() => {
    return currentPages.value[currentPageIndex.value];
});

const toggleImmersive = () => {
    immersiveMode.value = !immersiveMode.value;
};

const nextPage = () => {
    if (currentPages.value && currentPageIndex.value < currentPages.value.length - 1) {
        currentPageIndex.value++;
        window.scrollTo(0, 0);
    }
};

const prevPage = () => {
    if (currentPageIndex.value > 0) {
        currentPageIndex.value--;
        window.scrollTo(0, 0);
    }
};

// Keyboard Navigation
const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
    if (e.key === 'Escape') immersiveMode.value = false;
};

// Touch Handling
const touchStartX = ref(0);
const touchStartTime = ref(0);
const lastTapTime = ref(0);

const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.changedTouches[0].screenX;
    touchStartTime.value = Date.now();
};

const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].screenX;
    const timeDiff = Date.now() - touchStartTime.value;
    const distDiff = touchStartX.value - touchEndX;

    // Swipe detection (horizontal)
    if (Math.abs(distDiff) > 50 && timeDiff < 300) {
        if (distDiff > 0) {
            nextPage();
        } else {
            prevPage();
        }
        return; // Swipe consumed the event
    }

    // Double tap detection
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapTime.value;
    if (tapLength < 300 && tapLength > 0 && Math.abs(distDiff) < 10) {
        cycleLanguage();
        // Prevent immersive toggle on double tap (optional, but good for UX)
        e.stopPropagation();
    }
    lastTapTime.value = currentTime;
};

const cycleLanguage = () => {
    const languages = availableLanguages.value;
    if (languages.length <= 1) return;

    const currentIndex = languages.indexOf(currentLanguage.value);
    const nextIndex = (currentIndex + 1) % languages.length;
    currentLanguage.value = languages[nextIndex];
};

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
});
</script>
