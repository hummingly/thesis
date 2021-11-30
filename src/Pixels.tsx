import { createEffect, createSignal, on, untrack } from "solid-js";
import { CANVAS_LEN } from "./utility/data";
import { useAppState } from "./AppState";
import { Container } from "./components/Container";

export const Pixels = () => {
    return (
        <section aria-labelledby="pixels-label" data-layout="pixels">
            <h2 id="pixels-label">Pixels</h2>
            <Container>
                <DrawingCanvas />
                <div aria-hidden="true" id="guidelines"></div>
            </Container>
        </section>
    );
};

const DrawingCanvas = () => {
    const [store, { createCanvasUpdate, draw }] = useAppState();

    let ctx: CanvasRenderingContext2D;
    createCanvasUpdate(
        () => ctx,
        () => store.selectedFrame
    );

    const [drawFlag, setDrawing] = createSignal(false);
    createEffect(
        on(drawFlag, () => {
            window.dispatchEvent(
                new CustomEvent(
                    "draw",
                    untrack(() => ({
                        detail: {
                            tool: store.activeTool,
                            colour: store.activeColour,
                        },
                    }))
                )
            );
        })
    );

    const pointers: Set<number> = new Set();
    let scale = 16;
    let top = 0;
    let left = 0;

    const handlePointerDown = (event: PointerEvent) => {
        if (event.button !== 0) {
            return;
        }
        pointers.add(event.pointerId);
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        left = rect.left;
        top = rect.top;
        scale = 16 / rect.width;
        const pixel = getPixelIndex(event, top, left, scale);
        draw(pixel);
        setDrawing((v) => !v);
    };

    const handlePointerMove = (event: PointerEvent) => {
        if (event.buttons !== 1 || event.button > 0) {
            return;
        }
        if (pointers.has(event.pointerId)) {
            event.preventDefault();
            const pixel = getPixelIndex(event, top, left, scale);
            draw(pixel);
            setDrawing((v) => !v);
        }
    };

    const handlePointerUp = (event: PointerEvent) => {
        pointers.delete(event.pointerId);
    };

    return (
        <canvas
            id="drawing-canvas"
            ref={(canvas: HTMLCanvasElement) => {
                const context = canvas.getContext("2d");
                if (context === null) {
                    throw new Error(
                        "Your device does not support rendering to a canvas. Please update your browser or switch to a device with canvas support."
                    );
                }
                ctx = context;
            }}
            aria-labelledby="pixels-label"
            height={CANVAS_LEN}
            width={CANVAS_LEN}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        ></canvas>
    );
};

const getPixelIndex = (event: PointerEvent, top: number, left: number, scale: number): number => {
    const row = (event.clientY - top) * scale;
    const column = (event.clientX - left) * scale;
    return (row >> 0) * 16 + (column >> 0);
};
