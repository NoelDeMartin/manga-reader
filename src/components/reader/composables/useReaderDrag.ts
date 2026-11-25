import { computed, nextTick, onBeforeUnmount, ref, type ComputedRef, type Ref } from 'vue';

import type { ReadingDirection } from '../types';

export type NavigationAction = 'next' | 'previous';

export interface UseReaderDragOptions {
    containerRef: Ref<HTMLElement | null>;
    frameRef: Ref<HTMLElement | null>;
    direction: () => ReadingDirection;
    canGoPrevious: () => boolean;
    canGoNext: () => boolean;
    onNavigate: (action: NavigationAction) => void;
    onToggleControls: () => void;
}

export interface UseReaderDragReturn {
    isPointerDragging: Ref<boolean>;
    isAnimating: Ref<boolean>;
    dragOffsetX: Ref<number>;
    dragScrollTop: Ref<number>;
    trackStyle: ComputedRef<{ transform: string; willChange: string }>;
    onCanvasClick: (event: MouseEvent) => void;
    onPointerDown: (event: PointerEvent) => void;
    onPointerMove: (event: PointerEvent) => void;
    onPointerUp: (event: PointerEvent) => void;
    onPointerCancel: (event: PointerEvent) => void;
    onPointerLeave: (event: PointerEvent) => void;
    onLostPointerCapture: (event: PointerEvent) => void;
    onTrackTransitionEnd: (event: TransitionEvent) => void;
    resetDrag: (animateSnapBack: boolean) => void;
    handleExternalPageChange: () => void;
}

const DRAG_SLOP_PX = 8;
const DRAG_MIN_DISTANCE_PX = 60;
const DRAG_MAX_THRESHOLD_PX = 120;
const DRAG_FLICK_MIN_DISTANCE_PX = 24;
const DRAG_FLICK_VELOCITY_PX_PER_MS = 0.45;
const EDGE_RESISTANCE_FACTOR = 0.22;
const SLIDE_ANIMATION_FALLBACK_MS = 260;

export function useReaderDrag(options: UseReaderDragOptions): UseReaderDragReturn {
    const isPointerDragging = ref(false);
    const isAnimating = ref(false);
    const dragOffsetX = ref(0);
    const dragScrollTop = ref(0);

    let activePointerId: number | null = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerStartTime = 0;
    let pendingAction: NavigationAction | null = null;
    let ignoreNextPageChangeReset = false;
    let animationFallbackTimer: number | null = null;
    let suppressNextClick = false;
    let suppressClickTimer: number | null = null;

    const trackStyle = computed(() => ({
        transform: `translate3d(${dragOffsetX.value}px, 0, 0)`,
        willChange: 'transform',
    }));

    function getDragAction(deltaX: number): NavigationAction {
        if (deltaX < 0) {
            return options.direction() === 'rtl' ? 'previous' : 'next';
        }

        return options.direction() === 'rtl' ? 'next' : 'previous';
    }

    function canPerformDragAction(action: NavigationAction): boolean {
        return action === 'next' ? options.canGoNext() : options.canGoPrevious();
    }

    function clearSuppressClickTimer() {
        if (suppressClickTimer !== null) {
            window.clearTimeout(suppressClickTimer);
            suppressClickTimer = null;
        }
    }

    function scheduleSuppressClickReset() {
        clearSuppressClickTimer();

        suppressClickTimer = window.setTimeout(() => {
            suppressNextClick = false;
            suppressClickTimer = null;
        }, 300);
    }

    function releaseActivePointerCapture(pointerId: number) {
        if (options.containerRef.value?.hasPointerCapture(pointerId)) {
            options.containerRef.value.releasePointerCapture(pointerId);
        }
    }

    function clearAnimationFallback() {
        if (animationFallbackTimer !== null) {
            window.clearTimeout(animationFallbackTimer);
            animationFallbackTimer = null;
        }
    }

    function scheduleAnimationFallback() {
        clearAnimationFallback();
        animationFallbackTimer = window.setTimeout(finishSlideAnimation, SLIDE_ANIMATION_FALLBACK_MS);
    }

    function finishSlideAnimation() {
        if (!isAnimating.value && pendingAction === null) {
            return;
        }

        clearAnimationFallback();

        const action = pendingAction;

        pendingAction = null;
        isAnimating.value = false;
        dragOffsetX.value = 0;

        if (action) {
            ignoreNextPageChangeReset = true;
            options.onNavigate(action);
            void nextTick(() => {
                ignoreNextPageChangeReset = false;
            });
        }
    }

    function getSlideWidth(): number {
        return options.frameRef.value?.clientWidth || options.containerRef.value?.clientWidth || 0;
    }

    function resetDrag(animateSnapBack: boolean) {
        const pointerId = activePointerId;

        activePointerId = null;
        isPointerDragging.value = false;
        pendingAction = null;

        if (pointerId !== null) {
            releaseActivePointerCapture(pointerId);
        }

        if (animateSnapBack && dragOffsetX.value !== 0) {
            isAnimating.value = true;
            dragOffsetX.value = 0;
            scheduleAnimationFallback();
        } else {
            clearAnimationFallback();
            isAnimating.value = false;
            dragOffsetX.value = 0;
        }
    }

    function handleExternalPageChange() {
        if (ignoreNextPageChangeReset) {
            ignoreNextPageChangeReset = false;

            return;
        }

        resetDrag(false);
    }

    function onTrackTransitionEnd(event: TransitionEvent) {
        if (event.target === event.currentTarget && event.propertyName === 'transform') {
            finishSlideAnimation();
        }
    }

    function onCanvasClick(event: MouseEvent) {
        if (suppressNextClick) {
            suppressNextClick = false;
            clearSuppressClickTimer();

            return;
        }

        const container = options.containerRef.value;

        if (!container) {
            return;
        }

        const rect = container.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;

        if (ratio < 0.3) {
            options.onNavigate(options.direction() === 'rtl' ? 'next' : 'previous');
        } else if (ratio > 0.7) {
            options.onNavigate(options.direction() === 'rtl' ? 'previous' : 'next');
        } else {
            options.onToggleControls();
        }
    }

    function onPointerDown(event: PointerEvent) {
        if (event.button !== 0) {
            return;
        }

        if (activePointerId !== null) {
            if (event.pointerType === 'touch') {
                resetDrag(true);
            }

            return;
        }

        suppressNextClick = false;
        clearSuppressClickTimer();

        if (pendingAction !== null) {
            finishSlideAnimation();
        } else if (isAnimating.value) {
            clearAnimationFallback();
            isAnimating.value = false;
            dragOffsetX.value = 0;
        }

        activePointerId = event.pointerId;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        pointerStartTime = event.timeStamp;
        dragScrollTop.value = options.containerRef.value?.scrollTop ?? 0;
    }

    function onPointerMove(event: PointerEvent) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        const deltaX = event.clientX - pointerStartX;
        const deltaY = event.clientY - pointerStartY;

        if (!isPointerDragging.value) {
            if (Math.abs(deltaX) < DRAG_SLOP_PX && Math.abs(deltaY) < DRAG_SLOP_PX) {
                return;
            }

            if (Math.abs(deltaX) < Math.abs(deltaY)) {
                resetDrag(false);

                return;
            }

            isPointerDragging.value = true;
            options.containerRef.value?.setPointerCapture(event.pointerId);
        }

        const action = getDragAction(deltaX);

        if (!canPerformDragAction(action)) {
            dragOffsetX.value = deltaX * EDGE_RESISTANCE_FACTOR;

            return;
        }

        const slideWidth = getSlideWidth();

        dragOffsetX.value = slideWidth > 0 ? Math.max(-slideWidth, Math.min(slideWidth, deltaX)) : deltaX;
    }

    function onPointerUp(event: PointerEvent) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        const wasDragging = isPointerDragging.value;
        const deltaX = event.clientX - pointerStartX;
        const elapsedMs = Math.max(1, event.timeStamp - pointerStartTime);
        const velocityX = Math.abs(deltaX) / elapsedMs;

        activePointerId = null;
        releaseActivePointerCapture(event.pointerId);

        if (!wasDragging) {
            resetDrag(false);

            return;
        }

        suppressNextClick = true;
        scheduleSuppressClickReset();

        const slideWidth = getSlideWidth();
        const threshold = Math.min(DRAG_MAX_THRESHOLD_PX, Math.max(DRAG_MIN_DISTANCE_PX, slideWidth * 0.15));
        const isFlick = velocityX >= DRAG_FLICK_VELOCITY_PX_PER_MS && Math.abs(deltaX) >= DRAG_FLICK_MIN_DISTANCE_PX;
        const action = getDragAction(deltaX);

        if ((Math.abs(deltaX) >= threshold || isFlick) && canPerformDragAction(action)) {
            const prefersReducedMotion =
                typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion || slideWidth <= 0 || Math.abs(dragOffsetX.value) >= slideWidth) {
                resetDrag(false);
                options.onNavigate(action);

                return;
            }

            const directionSign = deltaX > 0 ? 1 : -1;

            isPointerDragging.value = false;
            pendingAction = action;
            isAnimating.value = true;
            dragOffsetX.value = directionSign * slideWidth;
            scheduleAnimationFallback();

            return;
        }

        resetDrag(true);
    }

    function onPointerCancel(event: PointerEvent) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        resetDrag(true);
    }

    function onPointerLeave(event: PointerEvent) {
        if (event.pointerId !== activePointerId || isPointerDragging.value) {
            return;
        }

        resetDrag(false);
    }

    function onLostPointerCapture(event: PointerEvent) {
        if (event.target !== event.currentTarget || event.pointerId !== activePointerId) {
            return;
        }

        resetDrag(true);
    }

    onBeforeUnmount(() => {
        clearAnimationFallback();
        clearSuppressClickTimer();
    });

    return {
        isPointerDragging,
        isAnimating,
        dragOffsetX,
        dragScrollTop,
        trackStyle,
        onCanvasClick,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onPointerLeave,
        onLostPointerCapture,
        onTrackTransitionEnd,
        resetDrag,
        handleExternalPageChange,
    };
}
