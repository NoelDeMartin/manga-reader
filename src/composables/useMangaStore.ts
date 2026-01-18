import { type ComputedRef, computed, reactive, toRaw } from 'vue';
import { type Chapter, type Manga, type MangaPage } from '@/data/manga';
import { deleteImages, deleteMangaFromDb, getAllMangas, getImage, saveImages, saveManga } from '@/services/db';

export interface MangaStore {
    mangas: ComputedRef<Manga[]>;
    addManga: (manga: Omit<Manga, 'id' | 'chapters'>) => Promise<void>;
    deleteManga: (id: string) => Promise<void>;
    addChapter: (mangaId: string, chapter: { number: number; language: string; files: File[] }) => Promise<void>;
    updateChapter: (
        mangaId: string,
        chapterId: string,
        language: string,
        pages: { url: string; imageId?: string; file?: File; fileName?: string }[]
    ) => Promise<void>;
    deleteChapter: (mangaId: string, chapterId: string) => Promise<void>;
    getManga: (id: string) => Manga | undefined;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const state = reactive<{ mangas: Manga[] }>({
    mangas: [],
});

// Hydrate images from IndexedDB
const hydrateMangaImages = async (manga: Manga) => {
    for (const chapter of manga.chapters) {
        for (const pages of Object.values(chapter.pages)) {
            for (const page of pages) {
                if (page.imageId) {
                    try {
                        const blob = await getImage(page.imageId);
                        if (blob) {
                            page.url = URL.createObjectURL(blob);
                        }
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error(`Failed to load image ${page.imageId}`, e);

                        alert(`Failed to load image ${page.imageId} (look at the console for more details)`);
                    }
                }
            }
        }
    }
};

const init = async () => {
    try {
        // Load from IDB
        const mangas = await getAllMangas();

        // Hydrate all loaded mangas
        for (const m of mangas) {
            await hydrateMangaImages(m);
        }

        // Merge with current state
        const currentIds = new Set(state.mangas.map((m) => m.id));
        const merged = [...state.mangas];
        for (const m of mangas) {
            if (!currentIds.has(m.id)) {
                merged.push(m);
            }
        }
        state.mangas = merged;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize manga store', e);
        alert('Failed to initialize manga store (look at the console for more details)');
    }
};

// Start initialization
init();

export const useMangaStore = (): MangaStore => {
    const addManga = async (data: Omit<Manga, 'id' | 'chapters'>) => {
        const newManga: Manga = {
            ...data,
            id: generateId(),
            chapters: [],
        };
        state.mangas.push(newManga);
        await saveManga(newManga);
    };

    const deleteManga = async (id: string) => {
        const manga = state.mangas.find((m) => m.id === id);
        if (manga) {
            // Cleanup images
            for (const chapter of manga.chapters) {
                for (const pages of Object.values(chapter.pages)) {
                    const imageIds = pages.map((p) => p.imageId).filter((imageId): imageId is string => !!imageId);
                    if (imageIds.length > 0) {
                        await deleteImages(imageIds);
                    }
                }
            }

            state.mangas = state.mangas.filter((m) => m.id !== id);
            await deleteMangaFromDb(id);
        }
    };

    const addChapter = async (mangaId: string, chapterData: { number: number; language: string; files: File[] }) => {
        const manga = state.mangas.find((m) => m.id === mangaId);
        if (manga) {
            // Sort files by name naturally (e.g. 1.jpg, 2.jpg, 10.jpg)
            const sortedFiles = [...chapterData.files].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            const imageIds = await saveImages(sortedFiles);

            const newPages: MangaPage[] = sortedFiles.map((file, index) => ({
                pageNumber: index + 1,
                url: URL.createObjectURL(file),
                imageId: imageIds[index],
                fileName: file.name,
            }));

            // Check if chapter number exists
            const chapter = manga.chapters.find((c) => c.number === chapterData.number);

            if (chapter) {
                // Add version to existing chapter
                chapter.pages[chapterData.language] = newPages;
            } else {
                // Create new chapter
                const newChapter: Chapter = {
                    id: generateId(),
                    number: chapterData.number,
                    pages: {
                        [chapterData.language]: newPages,
                    },
                };
                manga.chapters.push(newChapter);
                manga.chapters.sort((a, b) => a.number - b.number);
            }

            await saveManga(toRaw(manga));
        }
    };

    const updateChapter = async (
        mangaId: string,
        chapterId: string,
        language: string,
        newPagesData: { url: string; imageId?: string; file?: File; fileName?: string }[],
    ) => {
        const manga = state.mangas.find((m) => m.id === mangaId);
        if (!manga) return;

        const chapter = manga.chapters.find((c) => c.id === chapterId);
        if (!chapter) return;

        // Ensure language entry exists (if it was added recently)
        const currentPages = chapter.pages[language] || [];

        // 1. Identify deleted images
        const oldImageIds = new Set(currentPages.map((p) => p.imageId).filter((id) => !!id));
        const newImageIds = new Set(newPagesData.map((p) => p.imageId).filter((id) => !!id));

        const idsToDelete: string[] = [];
        for (const id of oldImageIds) {
            if (!newImageIds.has(id)) {
                if (typeof id === 'string') idsToDelete.push(id);
            }
        }

        if (idsToDelete.length > 0) {
            await deleteImages(idsToDelete);
        }

        // 2. Upload new files
        const newPages: MangaPage[] = [];
        for (let i = 0; i < newPagesData.length; i++) {
            const pageData = newPagesData[i];
            if (pageData.file) {
                const [id] = await saveImages([pageData.file]);
                newPages.push({
                    pageNumber: i + 1,
                    url: URL.createObjectURL(pageData.file),
                    imageId: id,
                    fileName: pageData.file.name,
                });
            } else {
                newPages.push({
                    pageNumber: i + 1,
                    url: pageData.url,
                    imageId: pageData.imageId,
                    fileName: pageData.fileName,
                });
            }
        }

        // 3. Update chapter
        chapter.pages[language] = newPages;

        // 4. Save Manga
        await saveManga(toRaw(manga));
    };

    const deleteChapter = async (mangaId: string, chapterId: string) => {
        const manga = state.mangas.find((m) => m.id === mangaId);
        if (manga) {
            const chapter = manga.chapters.find((c) => c.id === chapterId);
            if (chapter) {
                // Delete all images from all versions
                const allPages = Object.values(chapter.pages).flat();
                const imageIds = allPages.map((p) => p.imageId).filter((id): id is string => !!id);

                await deleteImages(imageIds);

                manga.chapters = manga.chapters.filter((c) => c.id !== chapterId);
                await saveManga(toRaw(manga));
            }
        }
    };

    const getManga = (id: string) => state.mangas.find((m) => m.id === id);

    return {
        mangas: computed(() => state.mangas),
        addManga,
        deleteManga,
        addChapter,
        updateChapter,
        deleteChapter,
        getManga,
    };
};
