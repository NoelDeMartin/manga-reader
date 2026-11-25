import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { type Component, nextTick } from 'vue';

import SolidImageStub from '@/testing/stubs/SolidImageStub.vue';

import ReaderCanvas from './ReaderCanvas.vue';
import type { ReaderSettings } from './types';

describe('ReaderCanvas drag navigation', () => {
    const VIEWPORT_WIDTH = 800;
    const DEFAULT_PAGES = Array.from({ length: 12 }, (_, index) => `https://example.com/page-${index + 1}.jpg`);
    const DEFAULT_SETTINGS: ReaderSettings = {
        mode: 'single',
        direction: 'rtl',
        fit: 'contain',
        theme: 'dark',
    };

    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH);
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: VIEWPORT_WIDTH,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: VIEWPORT_WIDTH,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        HTMLElement.prototype.setPointerCapture = vi.fn();
        HTMLElement.prototype.releasePointerCapture = vi.fn();
        HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(true);
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    });

    it('slides directly to the next page when dragging right in RTL and suppresses the trailing click', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        // Act - Drag
        await startDrag(container.element, { fromX: 200, toX: 450 });

        // Assert - Drag
        expect(track.attributes('style')).toContain('translate3d(250px, 0, 0)');

        // Act - Release
        await dispatchPointer(container.element, 'pointerup', { clientX: 450, timeStamp: 120 });

        // Assert - Release
        expect(track.attributes('style')).toContain(`translate3d(${VIEWPORT_WIDTH}px, 0, 0)`);
        expect(wrapper.emitted('next')).toBeUndefined();

        // Act - Trailing click
        await container.trigger('click', { clientX: 400, clientY: 300 });

        // Assert - Trailing click
        expect(wrapper.emitted('toggleControls')).toBeUndefined();

        // Act - Animation end
        await finishAnimation(track.element);

        // Assert - Animation end
        expect(wrapper.emitted('next')).toHaveLength(1);
        expect(track.attributes('style')).toContain('translate3d(0px, 0, 0)');
    });

    it('slides to the previous page when dragging left in RTL', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 2 });

        // Act
        await drag(container.element, { fromX: 600, toX: 350 });

        // Assert - Slide
        expect(track.attributes('style')).toContain(`translate3d(-${VIEWPORT_WIDTH}px, 0, 0)`);

        // Act - Animation end
        await finishAnimation(track.element);

        // Assert - Animation end
        expect(wrapper.emitted('previous')).toHaveLength(1);
    });

    it('respects LTR reading direction for drag navigation', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({
            currentPage: 2,
            settings: { ...DEFAULT_SETTINGS, direction: 'ltr' },
        });

        // Act
        await drag(container.element, { fromX: 600, toX: 350 });
        await finishAnimation(track.element);

        // Assert
        expect(wrapper.emitted('next')).toHaveLength(1);
        expect(wrapper.emitted('previous')).toBeUndefined();
    });

    it('snaps back without turning the page when a slow drag is below threshold', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 2 });

        // Act
        await drag(container.element, { fromX: 400, toX: 440, durationMs: 500 });

        // Assert - Snap back
        expect(track.attributes('style')).toContain('translate3d(0px, 0, 0)');

        // Act - Animation end
        await finishAnimation(track.element);

        // Assert - Animation end
        expect(wrapper.emitted('next')).toBeUndefined();
        expect(wrapper.emitted('previous')).toBeUndefined();
    });

    it('applies rubber-band resistance at the first page boundary and does not navigate', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        // Act - Drag past boundary
        await startDrag(container.element, { fromX: 600, toX: 400 });

        // Assert - Drag past boundary
        expect(track.attributes('style')).toContain('translate3d(-44px, 0, 0)');

        // Act - Release
        await dispatchPointer(container.element, 'pointerup', { clientX: 400, timeStamp: 120 });
        await finishAnimation(track.element);

        // Assert - Release
        expect(wrapper.emitted('previous')).toBeUndefined();
        expect(wrapper.emitted('next')).toBeUndefined();
    });

    it('still supports click navigation when not dragging', async () => {
        // Arrange
        const { wrapper, container } = mountCanvas({ currentPage: 2 });

        // Act - Left zone
        await container.trigger('click', { clientX: 100, clientY: 300 });

        // Assert - Left zone
        expect(wrapper.emitted('next')).toHaveLength(1);

        // Act - Right zone
        await container.trigger('click', { clientX: 700, clientY: 300 });

        // Assert - Right zone
        expect(wrapper.emitted('previous')).toHaveLength(1);

        // Act - Center zone
        await container.trigger('click', { clientX: 400, clientY: 300 });

        // Assert - Center zone
        expect(wrapper.emitted('toggleControls')).toHaveLength(1);
    });

    it('preloads adjacent spreads in sorted order and reuses DOM nodes across page turns', async () => {
        // Arrange
        const { wrapper } = mountCanvas({
            currentPage: 2,
            secondaryPage: 3,
            pageStep: 2,
            settings: { ...DEFAULT_SETTINGS, mode: 'double' },
        });

        const initialSrcs = wrapper.findAll('img').map((img) => img.attributes('src'));
        const page5ImgBefore = wrapper.find('img[src="https://example.com/page-5.jpg"]').element;

        // Assert - Initial preload
        expect(initialSrcs).toEqual([
            'https://example.com/page-2.jpg',
            'https://example.com/page-1.jpg',
            'https://example.com/page-4.jpg',
            'https://example.com/page-3.jpg',
            'https://example.com/page-6.jpg',
            'https://example.com/page-5.jpg',
            'https://example.com/page-8.jpg',
            'https://example.com/page-7.jpg',
            'https://example.com/page-10.jpg',
            'https://example.com/page-9.jpg',
        ]);
        expect(page5ImgBefore.getAttribute('alt')).toBe('');

        // Act
        await wrapper.setProps({ currentPage: 4, secondaryPage: 5 });
        await nextTick();

        // Assert - Reused DOM node
        const page5ImgAfter = wrapper.find('img[src="https://example.com/page-5.jpg"]').element;

        expect(page5ImgAfter).toBe(page5ImgBefore);
        expect(page5ImgAfter.getAttribute('alt')).toBe('reader.pageAlt');
    });

    it('eagerly decodes preloaded images on load', async () => {
        // Arrange
        const decode = vi.fn().mockResolvedValue(undefined);
        const { wrapper } = mountCanvas({ currentPage: 0 });
        const img = wrapper.find('img');

        Object.defineProperty(img.element, 'decode', { value: decode, configurable: true });

        // Act
        await img.trigger('load');

        // Assert
        expect(decode).toHaveBeenCalledTimes(1);
    });

    it('recovers pointer state after a vertical drag or pointer leave before horizontal capture', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        // Act - Vertical drag released outside the container
        await dispatchPointer(container.element, 'pointerdown', { clientX: 400, clientY: 300, timeStamp: 0 });
        await dispatchPointer(container.element, 'pointermove', { clientX: 402, clientY: 350, timeStamp: 50 });

        // Act - Pointer leave before crossing drag slop
        await dispatchPointer(container.element, 'pointerdown', { clientX: 400, clientY: 300, timeStamp: 100 });
        await dispatchPointer(container.element, 'pointerleave', { clientX: 402, clientY: 300, timeStamp: 110 });

        // Act - Subsequent horizontal drag
        await drag(container.element, { fromX: 200, toX: 450 });
        await finishAnimation(track.element);

        // Assert
        expect(wrapper.emitted('next')).toHaveLength(1);
    });

    it('cancels an in-flight slide animation when currentPage changes externally', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        await drag(container.element, { fromX: 200, toX: 450 });
        expect(track.attributes('style')).toContain(`translate3d(${VIEWPORT_WIDTH}px, 0, 0)`);

        // Act - External page change before transition finishes
        await wrapper.setProps({ currentPage: 3 });
        await nextTick();
        await finishAnimation(track.element);

        // Assert
        expect(track.attributes('style')).toContain('translate3d(0px, 0, 0)');
        expect(wrapper.emitted('next')).toBeUndefined();
    });

    it('triggers page navigation on a fast short flick', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        // Act - 40px in 40ms (1px/ms >= 0.45px/ms flick threshold)
        await drag(container.element, { fromX: 400, toX: 440, durationMs: 20 });
        await finishAnimation(track.element);

        // Assert
        expect(wrapper.emitted('next')).toHaveLength(1);
    });

    it('commits navigation immediately without animation when prefers-reduced-motion is enabled', async () => {
        // Arrange
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        // Act
        await drag(container.element, { fromX: 200, toX: 450 });

        // Assert
        expect(wrapper.emitted('next')).toHaveLength(1);
        expect(track.attributes('style')).toContain('translate3d(0px, 0, 0)');
    });

    it('clamps drag offset to slideWidth and commits immediately when dragged past full width', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        // Act - Drag 1000px (> 800px slideWidth)
        await startDrag(container.element, { fromX: 0, toX: 1000 });

        // Assert - Clamped to +800px
        expect(track.attributes('style')).toContain(`translate3d(${VIEWPORT_WIDTH}px, 0, 0)`);

        // Act - Release
        await dispatchPointer(container.element, 'pointerup', { clientX: 1000, timeStamp: 120 });

        // Assert - Commits immediately without waiting for transitionend
        expect(wrapper.emitted('next')).toHaveLength(1);
        expect(track.attributes('style')).toContain('translate3d(0px, 0, 0)');
    });

    it('supports starting a rapid second drag during an in-flight slide animation', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        await drag(container.element, { fromX: 200, toX: 450 });
        expect(wrapper.emitted('next')).toBeUndefined();

        // Act - Start second drag before first transition ends, while parent updates currentPage
        const downEvent = new Event('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;

        Object.defineProperties(downEvent, {
            button: { value: 0 },
            pointerId: { value: 1 },
            clientX: { value: 200 },
            clientY: { value: 300 },
            timeStamp: { value: 200 },
        });
        container.element.dispatchEvent(downEvent);
        await wrapper.setProps({ currentPage: 1 });
        await nextTick();

        await dispatchPointer(container.element, 'pointermove', { clientX: 450, timeStamp: 250 });
        await dispatchPointer(container.element, 'pointerup', { clientX: 450, timeStamp: 270 });
        await finishAnimation(track.element);

        // Assert - Both the interrupted slide and the rapid second drag emitted 'next'
        expect(wrapper.emitted('next')).toHaveLength(2);
    });

    it('ignores lostpointercapture bubbling from a child image when transferring touch capture', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });
        const img = wrapper.find('img').element;

        // Act - Start dragging, then fire a bubbling lostpointercapture from the child <img>
        await startDrag(container.element, { fromX: 200, toX: 300 });
        await dispatchPointer(img, 'lostpointercapture', { clientX: 300, timeStamp: 105 });
        await dispatchPointer(container.element, 'pointermove', { clientX: 450, timeStamp: 120 });

        // Assert - Drag stays active and tracks the pointer
        expect(track.attributes('style')).toContain('translate3d(250px, 0, 0)');

        // Act - Release
        await dispatchPointer(container.element, 'pointerup', { clientX: 450, timeStamp: 140 });
        await finishAnimation(track.element);

        // Assert
        expect(wrapper.emitted('next')).toHaveLength(1);
    });

    it('clears click suppression on a new pointerdown so a quick tap after a touch drag is not swallowed', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 2 });

        await drag(container.element, { fromX: 400, toX: 440, durationMs: 500 });
        await finishAnimation(track.element);

        // Act - Quick tap (pointerdown -> pointerup -> click) within 300ms of the drag
        await dispatchPointer(container.element, 'pointerdown', { clientX: 400, timeStamp: 600 });
        await dispatchPointer(container.element, 'pointerup', { clientX: 400, timeStamp: 620 });
        await container.trigger('click', { clientX: 400, clientY: 300 });

        // Assert
        expect(wrapper.emitted('toggleControls')).toHaveLength(1);
    });

    it('cancels an active drag when a second touch pointer arrives', async () => {
        // Arrange
        const { wrapper, container, track } = mountCanvas({ currentPage: 0 });

        await startDrag(container.element, { fromX: 200, toX: 450 });
        expect(track.attributes('style')).toContain('translate3d(250px, 0, 0)');

        // Act - Second finger touches down for pinch-to-zoom
        await dispatchPointer(container.element, 'pointerdown', {
            clientX: 500,
            timeStamp: 110,
            pointerId: 2,
            pointerType: 'touch',
        });
        await finishAnimation(track.element);

        // Assert
        expect(track.attributes('style')).toContain('translate3d(0px, 0, 0)');
        expect(wrapper.emitted('next')).toBeUndefined();
    });

    function mountCanvas(props: Record<string, unknown> = {}) {
        const wrapper = mount(ReaderCanvas as unknown as Component, {
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    SolidImage: SolidImageStub,
                    RouterLink: { template: '<a><slot /></a>' },
                },
            },
            props: {
                pages: DEFAULT_PAGES,
                currentPage: 0,
                secondaryPage: null,
                pageStep: 1,
                chapterNumber: '001',
                settings: DEFAULT_SETTINGS,
                ...props,
            },
        });

        return {
            wrapper,
            container: wrapper.find('main > div'),
            track: wrapper.find('main > div > div > div'),
        };
    }

    async function startDrag(
        element: Element,
        { fromX, toX, durationMs = 100 }: { fromX: number; toX: number; durationMs?: number },
    ) {
        await dispatchPointer(element, 'pointerdown', { clientX: fromX, timeStamp: 0 });
        await dispatchPointer(element, 'pointermove', { clientX: toX, timeStamp: durationMs });
    }

    async function drag(
        element: Element,
        { fromX, toX, durationMs = 100 }: { fromX: number; toX: number; durationMs?: number },
    ) {
        await startDrag(element, { fromX, toX, durationMs });
        await dispatchPointer(element, 'pointerup', { clientX: toX, timeStamp: durationMs + 20 });
    }

    async function finishAnimation(element: Element) {
        const event = new Event('transitionend', { bubbles: true });

        Object.defineProperty(event, 'propertyName', { value: 'transform' });

        element.dispatchEvent(event);
        await nextTick();
    }

    async function dispatchPointer(
        element: Element,
        type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'pointerleave' | 'lostpointercapture',
        {
            clientX,
            clientY = 300,
            timeStamp,
            pointerId = 1,
            pointerType = 'mouse',
        }: { clientX: number; clientY?: number; timeStamp: number; pointerId?: number; pointerType?: string },
    ) {
        const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;

        Object.defineProperties(event, {
            button: { value: 0 },
            pointerId: { value: pointerId },
            pointerType: { value: pointerType },
            clientX: { value: clientX },
            clientY: { value: clientY },
            timeStamp: { value: timeStamp },
        });

        element.dispatchEvent(event);
        await nextTick();
    }
});
