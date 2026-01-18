<template>
    <div class="px-4 py-6 md:px-8">
        <!-- Add Manga Form -->
        <div class="mb-8 rounded-lg bg-gray-800 p-6 shadow-md">
            <h2 class="mb-4 text-xl font-bold text-gray-100">
                Add New Manga
            </h2>
            <form class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="handleAddManga">
                <input
                    v-model="newManga.title"
                    type="text"
                    placeholder="Manga Title"
                    required
                    class="focus:ring-primary-500 rounded bg-gray-700 p-2 text-white outline-none focus:ring-2"
                >
                <input
                    v-model="newManga.coverUrl"
                    type="url"
                    placeholder="Cover URL (optional)"
                    class="focus:ring-primary-500 rounded bg-gray-700 p-2 text-white outline-none focus:ring-2"
                >
                <textarea
                    v-model="newManga.description"
                    placeholder="Description"
                    class="focus:ring-primary-500 col-span-full rounded bg-gray-700 p-2 text-white outline-none focus:ring-2 lg:col-span-1"
                />
                <button
                    type="submit"
                    class="bg-primary-600 hover:bg-primary-700 col-span-full rounded px-4 py-2 font-bold text-white transition-colors"
                >
                    Add Manga
                </button>
            </form>
        </div>

        <h2 class="mb-6 text-xl font-bold text-gray-100">
            Library
        </h2>

        <div
            v-if="mangas.length === 0"
            class="flex h-32 items-center justify-center rounded-lg bg-gray-800 text-gray-400"
        >
            Your library is empty. Add a manga to get started!
        </div>

        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <div
                v-for="manga in mangas"
                :key="manga.id"
                class="group relative flex flex-col overflow-hidden rounded-lg bg-gray-800 shadow-md transition-transform hover:scale-105"
            >
                <router-link :to="{ name: 'manga-details', params: { id: manga.id } }" class="grow">
                    <div class="aspect-[2/3] w-full overflow-hidden">
                        <img
                            :src="manga.coverUrl || 'https://placehold.co/400x600?text=No+Cover'"
                            :alt="manga.title"
                            class="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                            loading="lazy"
                        >
                    </div>
                    <div class="p-3">
                        <h3 class="truncate text-sm font-semibold text-white" :title="manga.title">
                            {{ manga.title }}
                        </h3>
                    </div>
                </router-link>
                <button
                    class="absolute top-2 right-2 rounded-full bg-red-600 p-1.5 text-white opacity-100 transition-opacity hover:bg-red-700 md:opacity-0 md:group-hover:opacity-100"
                    title="Delete Manga"
                    @click="deleteManga(manga.id)"
                >
                    <i-mdi-delete class="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useMangaStore } from '@/composables/useMangaStore';

const { mangas, addManga, deleteManga } = useMangaStore();

const newManga = reactive({
    title: '',
    coverUrl: '',
    description: '',
});

const handleAddManga = () => {
    addManga({
        title: newManga.title,
        coverUrl:
            newManga.coverUrl ||
            `https://placehold.co/400x600/333333/ffffff?text=${encodeURIComponent(newManga.title)}`,
        description: newManga.description,
    });
    // Reset form
    newManga.title = '';
    newManga.coverUrl = '';
    newManga.description = '';
};
</script>
