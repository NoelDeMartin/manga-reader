import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ChapterReader from './ChapterReader.vue';
import { MOCK_LANGUAGES, MOCK_PAGES } from './stories.fixtures';

const meta = {
    title: 'Reader/ChapterReader',
    component: ChapterReader,
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof ChapterReader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        seriesName: 'One Piece',
        chapterNumber: '001',
        pages: MOCK_PAGES,
        languages: MOCK_LANGUAGES,
        activeLanguage: 'en',
        previousChapter: { number: '000', to: '#' },
        nextChapter: { number: '002', to: '#' },
        persistSettings: false,
    },
};

export const DoublePageSpread: Story = {
    args: {
        ...Default.args,
        initialSettings: { mode: 'double', direction: 'rtl', fit: 'contain', theme: 'dark' },
    },
};

export const VerticalStrip: Story = {
    args: {
        ...Default.args,
        initialSettings: { mode: 'vertical', direction: 'rtl', fit: 'contain', theme: 'dark' },
    },
};

export const LightTheme: Story = {
    args: {
        ...Default.args,
        initialSettings: { mode: 'single', direction: 'ltr', fit: 'contain', theme: 'light' },
    },
};

export const LongTitle: Story = {
    args: {
        ...Default.args,
        seriesName: 'That Time I Got Reincarnated as a Very Long Manga Series Title With Extra Subtitles',
        chapterNumber: '1124.5',
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        pages: undefined,
    },
};

export const Empty: Story = {
    args: {
        ...Default.args,
        pages: [],
    },
};

export const Uploading: Story = {
    args: {
        ...Default.args,
        pages: [],
        uploading: true,
    },
};
