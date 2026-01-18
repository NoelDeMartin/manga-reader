<template>
    <div v-if="manga" class="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div class="flex flex-col gap-8 md:flex-row">
            <!-- Cover Image -->
            <div class="mx-auto w-48 flex-shrink-0 md:mx-0 md:w-64">
                <img :src="manga.coverUrl" :alt="manga.title" class="h-auto w-full rounded-lg shadow-lg">
            </div>

            <!-- Details -->
            <div class="flex-grow">
                <h1 class="mb-4 text-3xl font-bold text-white">
                    {{ manga.title }}
                </h1>

                <div class="mb-8">
                    <h3 class="mb-2 text-lg font-semibold text-gray-200">
                        Synopsis
                    </h3>
                    <p class="leading-relaxed text-gray-300">
                        {{ manga.description }}
                    </p>
                </div>

                <!-- Add Chapter Form -->
                <div class="mb-8 rounded-lg bg-gray-800 p-6 shadow-md">
                    <h3 class="mb-4 text-lg font-bold text-gray-100">
                        Add New Chapter
                    </h3>
                    <form
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        @submit.prevent="handleAddChapter"
                    >
                        <input
                            v-model.number="newChapter.number"
                            type="number"
                            placeholder="Ch #"
                            required
                            class="focus:ring-primary-500 rounded bg-gray-700 p-2 text-white outline-none focus:ring-2"
                        >
                        <select
                            v-model="newChapter.language"
                            class="focus:ring-primary-500 rounded bg-gray-700 p-2 text-white outline-none focus:ring-2"
                        >
                            <option value="en">
                                English
                            </option>
                            <option value="es">
                                Spanish
                            </option>
                            <option value="fr">
                                French
                            </option>
                            <option value="jp">
                                Japanese
                            </option>
                            <option value="de">
                                German
                            </option>
                            <option value="it">
                                Italian
                            </option>
                            <option value="pt">
                                Portuguese
                            </option>
                            <option value="ru">
                                Russian
                            </option>
                        </select>
                        <div class="relative lg:col-span-1">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                required
                                class="w-full text-sm text-gray-400 file:mr-4 file:rounded file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-600"
                                @change="handleFileChange"
                            >
                        </div>
                        <button
                            type="submit"
                            :disabled="isUploading"
                            class="bg-primary-600 hover:bg-primary-700 col-span-full rounded px-4 py-2 font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {{ isUploading ? 'Uploading...' : 'Add Chapter / Version' }}
                        </button>
                    </form>
                </div>

                <!-- Chapters List -->
                <div>
                    <h3 class="mb-4 text-xl font-bold text-gray-200">
                        Chapters
                    </h3>
                    <div class="flex flex-col gap-2">
                        <div
                            v-for="chapter in manga.chapters"
                            :key="chapter.id"
                            class="group flex flex-wrap items-center justify-between gap-4 rounded bg-gray-800 p-4 transition-colors hover:bg-gray-700"
                        >
                            <div class="min-w-[150px] font-medium text-white">
                                Chapter {{ chapter.number }}
                            </div>

                            <div class="flex flex-wrap items-center gap-2">
                                <router-link
                                    v-for="(pages, lang) in chapter.pages"
                                    :key="lang"
                                    :to="{ name: 'reader', params: { chapterId: chapter.id }, query: { lang } }"
                                    class="hover:bg-primary-600 rounded bg-gray-600 px-2 py-1 text-xs font-bold text-white uppercase"
                                    :title="`Read in ${lang}`"
                                >
                                    {{ lang }}
                                </router-link>
                            </div>

                            <div class="ml-auto flex items-center gap-4">
                                <router-link
                                    :to="{
                                        name: 'edit-chapter',
                                        params: { mangaId: manga.id, chapterId: chapter.id },
                                    }"
                                    class="rounded-full p-1.5 text-gray-400 opacity-100 transition-opacity hover:bg-gray-600 hover:text-white md:opacity-0 md:group-hover:opacity-100"
                                    title="Edit Chapter"
                                >
                                    <i-mdi-pencil class="h-4 w-4" />
                                </router-link>
                                <button
                                    class="rounded-full bg-red-600 p-1.5 text-white opacity-100 transition-opacity hover:bg-red-700 md:opacity-0 md:group-hover:opacity-100"
                                    title="Delete Chapter"
                                    @click="deleteChapter(manga.id, chapter.id)"
                                >
                                    <i-mdi-delete class="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="flex h-64 items-center justify-center text-gray-400">
        Manga not found.
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMangaStore } from '@/composables/useMangaStore';

const route = useRoute();
const mangaId = route.params.id as string;
const { mangas, addChapter, deleteChapter } = useMangaStore();

const manga = computed(() => mangas.value.find((m) => m.id === mangaId));
const isUploading = ref(false);

const newChapter = reactive({
    number: (manga.value?.chapters.length ?? 0) + 1,
    language: 'en',
    files: [] as File[],
});

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files) {
        newChapter.files = Array.from(input.files);
    }
};

const handleAddChapter = async () => {
    if (!manga.value || newChapter.files.length === 0) return;

    isUploading.value = true;
    try {
        await addChapter(manga.value.id, {
            number: newChapter.number,
            language: newChapter.language,
            files: newChapter.files,
        });

        // Reset form
        newChapter.number = (manga.value.chapters.length ?? 0) + 1;
        newChapter.files = [];
        // Reset file input manually if needed, or simple ref
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    } finally {
        isUploading.value = false;
    }
};
</script>
