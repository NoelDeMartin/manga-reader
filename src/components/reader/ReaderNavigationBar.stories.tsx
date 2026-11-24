import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ReaderNavigationBar from './ReaderNavigationBar.vue';

const meta = {
    title: 'Reader/ReaderNavigationBar',
    component: ReaderNavigationBar,
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof ReaderNavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SinglePageRtl: Story = {
    args: {
        currentPage: 2,
        totalPages: 18,
        mode: 'single',
        direction: 'rtl',
        theme: 'dark',
        visible: true,
        previousChapter: { number: '000', to: '#' },
        nextChapter: { number: '002', to: '#' },
    },
};

export const DoublePageSpread: Story = {
    args: {
        ...SinglePageRtl.args,
        currentPage: 0,
        secondaryPage: 1,
        mode: 'double',
    },
};

export const LightThemeLtr: Story = {
    args: {
        ...SinglePageRtl.args,
        direction: 'ltr',
        theme: 'light',
    },
};

export const SinglePageChapter: Story = {
    args: {
        currentPage: 0,
        totalPages: 1,
        mode: 'single',
        direction: 'rtl',
        theme: 'dark',
        visible: true,
    },
};
