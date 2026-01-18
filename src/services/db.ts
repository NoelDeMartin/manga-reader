import { type DBSchema, openDB } from 'idb';
import type { Manga } from '@/data/manga';

interface MangaDB extends DBSchema {
    images: {
        key: string;
        value: Blob;
    };
    mangas: {
        key: string;
        value: Manga;
    };
}

const DB_NAME = 'manga-reader-db';

const dbPromise = openDB<MangaDB>(DB_NAME, 2, {
    upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            db.createObjectStore('images');
        }
        if (oldVersion < 2) {
            db.createObjectStore('mangas', { keyPath: 'id' });
        }
    },
});

// Image Operations
export const saveImage = async (blob: Blob): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const db = await dbPromise;
    await db.put('images', blob, id);
    return id;
};

export const saveImages = async (blobs: Blob[]): Promise<string[]> => {
    const ids = await Promise.all(blobs.map(saveImage));
    return ids;
};

export const getImage = async (id: string): Promise<Blob | undefined> => {
    const db = await dbPromise;
    return db.get('images', id);
};

export const deleteImage = async (id: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete('images', id);
};

export const deleteImages = async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(deleteImage));
};

// Manga Operations
export const getAllMangas = async (): Promise<Manga[]> => {
    const db = await dbPromise;
    return db.getAll('mangas');
};

export const saveManga = async (manga: Manga): Promise<void> => {
    const db = await dbPromise;
    await db.put('mangas', manga);
};

export const saveMangas = async (mangas: Manga[]): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction('mangas', 'readwrite');
    await Promise.all([...mangas.map((m) => tx.store.put(m)), tx.done]);
};

export const deleteMangaFromDb = async (id: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete('mangas', id);
};
