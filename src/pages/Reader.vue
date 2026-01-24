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
                <button
                    class="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white hover:bg-gray-700"
                    title="Switch Language"
                    @click.stop="cycleLanguage"
                >
                    {{ currentLanguage.toUpperCase() }}
                </button>
            </div>

            <div class="text-sm text-gray-400">
                Chapter {{ chapter.number }} <span class="uppercase">[{{ currentLanguage }}]</span>: Slide
                {{ currentSlideIndex + 1 }} / {{ virtualSlides.length }}
            </div>
        </div>

        <!-- Reader Area -->
        <div
            class="flex grow items-center justify-center overflow-hidden py-0 pb-12 md:py-12"
            @click="toggleImmersive"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
        >
            <div
                class="relative flex h-full w-full max-w-5xl items-center justify-center transition-transform duration-200 ease-out"
                :style="trackStyle"
            >
                <!-- Navigation Zones (Click only) -->
                <div
                    class="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
                    title="Next Page"
                    @click.stop="nextPage"
                />
                <div
                    class="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize"
                    title="Previous Page"
                    @click.stop="prevPage"
                />

                <!-- Images Track -->
                <div class="flex h-full w-full items-center justify-center">
                    <!-- Images -->
                    <div class="flex h-full w-full items-center justify-center gap-1">
                        <!-- Left Image (Next Page in RTL) -->
                        <img
                            v-if="currentView[1]"
                            :src="currentView[1].url"
                            alt="Manga Page Left"
                            class="h-auto max-h-full w-auto max-w-[50%] object-contain select-none"
                        >
                        <!-- Right Image (Current Page in RTL) -->
                        <img
                            v-if="currentView[0]"
                            :src="currentView[0].url"
                            alt="Manga Page Right"
                            class="h-auto max-h-full w-auto object-contain select-none"
                            :class="{ 'max-w-[50%]': currentView.length > 1, 'max-w-full': currentView.length === 1 }"
                        >
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Controls (Mobile mainly) -->
        <div
            v-if="!immersiveMode"
            class="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between bg-black/80 p-4 backdrop-blur-sm md:hidden"
        >
            <button class="p-2 text-white disabled:opacity-50" :disabled="currentSlideIndex === 0" @click="prevPage">
                Prev
            </button>
            <span class="text-xs">{{ currentSlideIndex + 1 }} / {{ virtualSlides.length }}</span>
            <button
                class="p-2 text-white disabled:opacity-50"
                :disabled="currentSlideIndex >= virtualSlides.length - 1"
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
import type { MangaPage } from '@/data/manga';

const route = useRoute();
const router = useRouter();
const chapterId = route.params.chapterId as string;
const { mangas } = useMangaStore();

const manga = computed(() => mangas.value.find((m) => m.chapters.some((c) => c.id === chapterId)));
const chapter = computed(() => manga.value?.chapters.find((c) => c.id === chapterId));

const currentSlideIndex = ref(0);
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
        // No need to reset page index, we use virtual slides now which align across languages!
    }
});

// Virtual Slide Logic
// A Virtual Slide represents one "view" (either a single page or a spread)
// It is consistent across all languages.
interface VirtualSlide {
    pages: Record<string, MangaPage[]>; // Lang -> [Pages to show]
}

const virtualSlides = computed<VirtualSlide[]>(() => {
    if (!chapter.value) return [];

    const slides: VirtualSlide[] = [];
    const languages = availableLanguages.value;
    const cursors: Record<string, number> = {}; // Track current page index for each lang

    // Initialize cursors
    languages.forEach((lang) => (cursors[lang] = 0));

    // We continue until all pages in all languages are consumed
    // (Assuming mostly consistent length, but handling mismatch safely)
    while (languages.some((lang) => chapter.value && cursors[lang] < chapter.value.pages[lang].length)) {
        const slide: VirtualSlide = { pages: {} };
        let isDoubleSlot = false;

        // 1. Check if ANY language has a double page at its current cursor
        for (const lang of languages) {
            const index = cursors[lang];
            const pages = chapter.value.pages[lang];
            if (index < pages.length && pages[index].isDoublePage) {
                isDoubleSlot = true;
                break;
            }
        }

        // 2. Consume pages for this slot
        for (const lang of languages) {
            const index = cursors[lang];
            const pages = chapter.value.pages[lang];
            const remaining = pages.length - index;

            if (remaining <= 0) {
                slide.pages[lang] = [];
                continue;
            }

            const p1 = pages[index];

            if (isDoubleSlot) {
                // This is a double slot.
                if (p1.isDoublePage) {
                    // Perfect match: Consume 1 double page
                    slide.pages[lang] = [p1];
                    cursors[lang]++;
                } else {
                    // Mismatch: Attempt to glue 2 single pages
                    if (remaining >= 2) {
                        const p2 = pages[index + 1];
                        if (!p2.isDoublePage) {
                            // Glue p1 and p2
                            slide.pages[lang] = [p1, p2];
                            cursors[lang] += 2;
                        } else {
                            // Edge case: p2 is double? shouldn't happen in valid book flow usually
                            // Just show p1 alone in a double slot (will render half width)
                            slide.pages[lang] = [p1];
                            cursors[lang]++;
                        }
                    } else {
                        // Only 1 page left, show it alone
                        slide.pages[lang] = [p1];
                        cursors[lang]++;
                    }
                }
            } else {
                // Single slot
                slide.pages[lang] = [p1];
                cursors[lang]++;
            }
        }
        slides.push(slide);
    }

    return slides;
});

const currentView = computed<MangaPage[]>(() => {
    if (virtualSlides.value.length === 0) return [];
    const slide = virtualSlides.value[currentSlideIndex.value];
    if (!slide) return [];

    // Return pages for current language, or fallback to first available
    return slide.pages[currentLanguage.value] || slide.pages[availableLanguages.value[0]] || [];
});

const toggleImmersive = () => {
    immersiveMode.value = !immersiveMode.value;
};

const nextPage = () => {
    if (currentSlideIndex.value < virtualSlides.value.length - 1) {
        currentSlideIndex.value++;
        window.scrollTo(0, 0);
    }
};

const prevPage = () => {
    if (currentSlideIndex.value > 0) {
        currentSlideIndex.value--;
        window.scrollTo(0, 0);
    }
};

// Keyboard Navigation
const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') prevPage();
    if (e.key === 'ArrowLeft') nextPage();
    if (e.key === 'Escape') immersiveMode.value = false;
};

// Touch Handling
const touchStartX = ref(0);
const touchCurrentX = ref(0);
const touchStartTime = ref(0);
const lastTapTime = ref(0);
const isDragging = ref(false);

const trackStyle = computed(() => {
    if (!isDragging.value) return {};
    const offset = touchCurrentX.value - touchStartX.value;
    return { transform: `translateX(${offset}px)` };
});

const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0].screenX;
    touchCurrentX.value = touchStartX.value;
    touchStartTime.value = Date.now();
    isDragging.value = true;
};

const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value) return;
    touchCurrentX.value = e.touches[0].screenX;
};

const handleTouchEnd = (e: TouchEvent) => {
    isDragging.value = false;
    const touchEndX = e.changedTouches[0].screenX;
    const distDiff = touchStartX.value - touchEndX;

    // Reset transform style
    // If threshold met, navigate
    // Threshold: 50px
    if (Math.abs(distDiff) > 50) {
        if (distDiff < 0) {
            // Drag Right (distDiff negative) -> Next Page (RTL)
            nextPage();
        } else {
            // Drag Left (distDiff positive) -> Prev Page (RTL)
            prevPage();
        }
        return;
    }

    // Double tap detection logic (unchanged)
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapTime.value;
    // Check minimal movement to distinguish tap from drag
    if (tapLength < 300 && tapLength > 0 && Math.abs(distDiff) < 10) {
        cycleLanguage();
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
