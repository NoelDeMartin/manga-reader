# Manga Reader PWA - Agent Context

## Project Overview

This is a local-first Manga Reader Progressive Web App (PWA) built with Vue 3. It allows users to manage a manga library, upload chapters (images), and read them in an immersive viewer. The application is designed to be fully offline-capable, storing all data and images within the browser's IndexedDB.

## Tech Stack

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (via `idb` library)
- **Routing**: Vue Router (@aerogel/plugin-routing)
- **Icons**: Unplugin Icons (Material Design `i-mdi-*`)

## Architecture & Data Flow

### 1. Data Models (`src/data/manga.ts`)

The core data structures are defined here.

- **Manga**: Top-level entity (`id`, `title`, `coverUrl`, `chapters[]`).
- **Chapter**: Contains `number` and a `pages` dictionary.
- **Pages**: Stored as `Record<string, MangaPage[]>`, where the key is the language code (e.g., 'en', 'es').
- **MangaPage**: Contains `url` (blob URL), `imageId` (IDB key), and `fileName` (original upload name).

### 2. State Management (`src/composables/useMangaStore.ts`)

- **Reactivity**: Uses a global `reactive` state, but exposes `mangas` as a `ComputedRef` to ensuring UI components update correctly when the store re-initializes or reloads from DB.
- **Initialization**: On app load, `init()` fetches metadata from IndexedDB.
- **Hydration**: `hydrateMangaImages` iterates through all pages and generates fresh `Blob` URLs (`URL.createObjectURL`) from the stored Blobs in IDB. This is crucial because Blob URLs are session-specific and expire on reload.
- **Optimistic Updates**: UI updates immediately, followed by async DB writes.

### 3. Storage Layer (`src/services/db.ts`)

- **Database**: `manga-reader-db`
- **Stores**:
    - `mangas`: Stores the JSON metadata of the manga library.
    - `images`: Stores binary image data (Blobs).
- **Logic**: Separates image storage from metadata to keep the main object store lightweight.

## Key Features & Implementation Details

### Library (Home)

- Displays a grid of manga covers.
- **Mobile Support**: Delete buttons are always visible on mobile, hover-only on desktop.
- **Persistence**: Auto-saves to IDB.

### Reader (`src/pages/Reader.vue`)

- **Navigation**:
    - **Tap**: Left 1/3 (Prev), Right 1/3 (Next).
    - **Keyboard**: Arrow keys.
    - **Swipe**: Touch swipe gestures (threshold > 50px).
- **Language Support**:
    - Dropdown in top bar.
    - **Double-tap gesture** cycles through available languages.
    - Persists language selection via URL query param (`?lang=en`).
- **Immersive Mode**: UI toggles visibility on click.

### Edit Chapter (`src/pages/EditChapter.vue`)

- **Multi-view**: Tabs to switch between language versions of the same chapter.
- **Batch Operations**: Checkbox selection for bulk deletion.
- **Sorting**: "Sort by Filename" button uses natural sort order (numeric-aware).
- **Preview**: Clicking a thumbnail opens a full-screen modal overlay.

## Development Guidelines

1.  **Formatting**: Always run `pnpm exec prettier-eslint ${filepath}` after modifying files.
2.  **Vue Reactivity**: When modifying the store, remember `mangas` is provided as a `ComputedRef`. Access it via `.value` in components.
3.  **Blob URLs**: Never store `blob:` strings in IDB. Store the `imageId`, and generate the URL at runtime during hydration.
4.  **Mobile First**: Ensure hover states have fallback visibility logic (`md:opacity-0`) for touch devices.
