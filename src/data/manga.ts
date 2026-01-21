export interface MangaPage {
    url: string;
    pageNumber: number;
    imageId?: string;
    fileName?: string;
    isDoublePage?: boolean;
}

export interface Chapter {
    id: string;
    number: number;
    pages: Record<string, MangaPage[]>;
}

export interface Manga {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    chapters: Chapter[];
}
