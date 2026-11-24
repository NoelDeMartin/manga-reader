import type { RouteLocationRaw } from 'vue-router';

export type ReadingMode = 'single' | 'double' | 'vertical';
export type ReadingDirection = 'rtl' | 'ltr';
export type PageFit = 'contain' | 'width';
export type ReaderTheme = 'dark' | 'light';

export interface ReaderSettings {
    mode: ReadingMode;
    direction: ReadingDirection;
    fit: PageFit;
    theme: ReaderTheme;
}

export interface ReaderLanguageOption {
    code: string;
    label: string;
}

export interface ReaderChapterLink {
    number: string;
    to: RouteLocationRaw;
}
