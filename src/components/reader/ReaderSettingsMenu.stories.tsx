import type { Meta, StoryObj } from '@storybook/vue3-vite';

import ReaderSettingsMenu from './ReaderSettingsMenu.vue';

const meta = {
    title: 'Reader/ReaderSettingsMenu',
    component: ReaderSettingsMenu,
} satisfies Meta<typeof ReaderSettingsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DarkMode: Story = {
    args: {
        settings: {
            mode: 'single',
            direction: 'rtl',
            fit: 'contain',
            theme: 'dark',
        },
    },
};

export const LightMode: Story = {
    args: {
        settings: {
            mode: 'double',
            direction: 'ltr',
            fit: 'width',
            theme: 'light',
        },
    },
};

export const VerticalMode: Story = {
    args: {
        settings: {
            mode: 'vertical',
            direction: 'rtl',
            fit: 'contain',
            theme: 'dark',
        },
    },
};
