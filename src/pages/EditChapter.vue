<template>
    <div v-if="manga && chapter" class="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-white">
                    Edit Chapter {{ chapter.number }}
                </h1>
                <p class="text-gray-400">
                    {{ manga.title }}
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    class="rounded bg-gray-700 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
                    @click="handleCancel"
                >
                    Cancel
                </button>
                <button
                    :disabled="isSaving"
                    class="bg-primary-600 hover:bg-primary-700 rounded px-4 py-2 font-bold text-white transition-colors disabled:opacity-50"
                    @click="handleSave"
                >
                    {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </button>
            </div>
        </div>

        <!-- Language Selector Tabs -->
        <div class="mb-6 border-b border-gray-700">
            <nav class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                <button
                    v-for="lang in availableLanguages"
                    :key="lang"
                    :class="[
                        currentLanguage === lang
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300',
                        'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap uppercase',
                    ]"
                    @click="changeLanguage(lang)"
                >
                    {{ lang }}
                </button>
            </nav>
        </div>

        <!-- Toolbar -->
        <div class="mb-4 flex flex-wrap items-center gap-4 rounded bg-gray-800 p-4">
            <div class="relative">
                <input
                    id="add-pages-input"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    @change="handleAddFiles"
                >
                <label
                    for="add-pages-input"
                    class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Add Pages
                </label>
            </div>
            <button
                class="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                @click="sortPages"
            >
                Sort by Filename
            </button>
            <button
                :disabled="selectedCount === 0"
                class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                @click="deleteSelected"
            >
                Delete Selected ({{ selectedCount }})
            </button>
        </div>

        <!-- Pages Table -->
        <div class="overflow-x-auto rounded-lg bg-gray-800 shadow">
            <table class="w-full text-left text-sm text-gray-400">
                <thead class="bg-gray-700 text-xs text-gray-100 uppercase">
                    <tr>
                        <th scope="col" class="px-6 py-3">
                            <input
                                type="checkbox"
                                :checked="allSelected"
                                class="text-primary-600 focus:ring-primary-500 rounded border-gray-600 bg-gray-700"
                                @change="toggleSelectAll"
                            >
                        </th>
                        <th scope="col" class="px-6 py-3">
                            #
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Preview
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Filename
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Source
                        </th>
                        <th scope="col" class="px-6 py-3 text-right">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(page, index) in localPages"
                        :key="page.tempId"
                        class="hover:bg-gray-750 border-b border-gray-700"
                    >
                        <td class="px-6 py-4">
                            <input
                                v-model="page.selected"
                                type="checkbox"
                                class="text-primary-600 focus:ring-primary-500 rounded border-gray-600 bg-gray-700"
                            >
                        </td>
                        <td class="px-6 py-4 font-medium text-white">
                            {{ index + 1 }}
                        </td>
                        <td class="px-6 py-4">
                            <div class="h-20 w-16 overflow-hidden rounded bg-gray-900">
                                <img
                                    :src="page.url"
                                    alt="Page Preview"
                                    class="h-full w-full cursor-pointer object-cover"
                                    @click="previewImage(page.url)"
                                >
                            </div>
                        </td>
                        <td class="px-6 py-4 font-mono text-xs text-gray-300">
                            {{ page.fileName || '-' }}
                        </td>
                        <td class="px-6 py-4">
                            <span v-if="page.file" class="rounded bg-green-900 px-2 py-1 text-xs text-green-100">
                                New Upload
                            </span>
                            <span v-else class="text-xs text-gray-500">Existing</span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex justify-end gap-2">
                                <button
                                    :disabled="index === 0"
                                    class="rounded p-1 hover:bg-gray-600 disabled:opacity-30"
                                    title="Move Up"
                                    @click="moveUp(index)"
                                >
                                    <i-mdi-arrow-up class="h-5 w-5" />
                                </button>
                                <button
                                    :disabled="index === localPages.length - 1"
                                    class="rounded p-1 hover:bg-gray-600 disabled:opacity-30"
                                    title="Move Down"
                                    @click="moveDown(index)"
                                >
                                    <i-mdi-arrow-down class="h-5 w-5" />
                                </button>
                                <button
                                    class="rounded p-1 text-red-500 hover:bg-gray-600"
                                    title="Delete"
                                    @click="deletePage(index)"
                                >
                                    <i-mdi-delete class="h-5 w-5" />
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="localPages.length === 0">
                        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                            No pages in this version. Add some!
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Image Preview Modal -->
        <div
            v-if="previewUrl"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            @click="closePreview"
        >
            <div class="relative max-h-full max-w-full">
                <img :src="previewUrl" alt="Full Preview" class="max-h-[90vh] max-w-full rounded shadow-lg">
                <button
                    class="absolute -top-4 -right-4 rounded-full bg-white p-1 text-black shadow hover:bg-gray-200"
                    @click="closePreview"
                >
                    <i-mdi-close class="h-6 w-6" />
                </button>
            </div>
        </div>
    </div>
    <div v-else class="flex h-64 items-center justify-center text-gray-400">
        Loading...
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMangaStore } from '@/composables/useMangaStore';

interface LocalPage {
    tempId: string; // For v-for key
    url: string;
    imageId?: string;
    file?: File;
    fileName?: string;
    selected: boolean;
}

const route = useRoute();
const router = useRouter();
const { getManga, updateChapter } = useMangaStore();

const mangaId = route.params.mangaId as string;
const chapterId = route.params.chapterId as string;

const manga = computed(() => getManga(mangaId));
const chapter = computed(() => manga.value?.chapters.find((c) => c.id === chapterId));

const localPages = ref<LocalPage[]>([]);
const isSaving = ref(false);
const currentLanguage = ref('en');
const availableLanguages = computed(() => (chapter.value ? Object.keys(chapter.value.pages) : []));
const previewUrl = ref<string | null>(null);

const loadPages = () => {
    if (!chapter.value) return;

    // Ensure current language exists in keys, otherwise pick first available
    if (!chapter.value.pages[currentLanguage.value] && availableLanguages.value.length > 0) {
        currentLanguage.value = availableLanguages.value[0];
    }

    const pages = chapter.value.pages[currentLanguage.value] || [];

    localPages.value = pages.map((p) => ({
        tempId: Math.random().toString(36),
        url: p.url,
        imageId: p.imageId,
        fileName: p.fileName,
        selected: false,
    }));
};

const init = () => {
    if (chapter.value) {
        loadPages();
    } else {
        router.push('/');
    }
};

onMounted(init);

const changeLanguage = (lang: string) => {
    if (currentLanguage.value === lang) return;

    // Check for unsaved changes (basic check: checking if file inputs exist or order changed)
    // For simplicity, we just prompt if there are new uploads pending
    const hasNewUploads = localPages.value.some((p) => !!p.file);
    if (hasNewUploads) {
        if (!confirm('You have unsaved uploads. Switching languages will discard them. Continue?')) {
            return;
        }
    }

    currentLanguage.value = lang;
    loadPages();
};

const selectedCount = computed(() => localPages.value.filter((p) => p.selected).length);
const allSelected = computed(() => localPages.value.length > 0 && localPages.value.every((p) => p.selected));

const toggleSelectAll = () => {
    const newState = !allSelected.value;
    localPages.value.forEach((p) => (p.selected = newState));
};

const handleAddFiles = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files) {
        const newFiles = Array.from(input.files).sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        newFiles.forEach((file) => {
            localPages.value.push({
                tempId: Math.random().toString(36),
                url: URL.createObjectURL(file),
                file: file,
                fileName: file.name,
                selected: false,
            });
        });
        input.value = ''; // Reset
    }
};

const sortPages = () => {
    if (localPages.value.length > 0 && !confirm('This will reorder all pages based on their filenames. Continue?')) {
        return;
    }

    localPages.value.sort((a, b) => {
        const nameA = a.fileName || '';
        const nameB = b.fileName || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
};

const deleteSelected = () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount.value} pages?`)) return;
    localPages.value = localPages.value.filter((p) => !p.selected);
};

const deletePage = (index: number) => {
    localPages.value.splice(index, 1);
};

const moveUp = (index: number) => {
    if (index > 0) {
        const temp = localPages.value[index];
        localPages.value[index] = localPages.value[index - 1];
        localPages.value[index - 1] = temp;
    }
};

const moveDown = (index: number) => {
    if (index < localPages.value.length - 1) {
        const temp = localPages.value[index];
        localPages.value[index] = localPages.value[index + 1];
        localPages.value[index + 1] = temp;
    }
};

const handleSave = async () => {
    isSaving.value = true;
    try {
        await updateChapter(mangaId, chapterId, currentLanguage.value, localPages.value);
        // Refresh local pages to reflect saved state (e.g. clear file blobs)
        loadPages();
        alert('Changes saved successfully!');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        alert('Failed to save changes (look at the console for more details)');
    } finally {
        isSaving.value = false;
    }
};

const handleCancel = () => {
    if (confirm('Discard unsaved changes?')) {
        router.back();
    }
};

const previewImage = (url: string) => {
    previewUrl.value = url;
};

const closePreview = () => {
    previewUrl.value = null;
};
</script>
