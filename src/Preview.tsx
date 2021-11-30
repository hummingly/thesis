import { Toolbar, ToolbarButton } from "./components/Toolbar";
import { useAppState } from "./AppState";
import { CANVAS_LEN, FPS } from "./utility/data";
import { clamp } from "./utility/color";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { Container } from "./components/Container";

const FRAME_DURATION_MS_RECIPROCAL = FPS / 1000;

export const Preview = () => {
    const [store, { createCanvasUpdate }] = useAppState();
    let ctx: CanvasRenderingContext2D;
    const [isPlaying, setIsPlaying] = createSignal(false);
    const [frameIndex, setFrameIndex] = createSignal(0);
    let handle: number | undefined = undefined;
    let stopWatch = 0;
    let elsapsedTime = 0;

    const draw = (timestamp: DOMHighResTimeStamp) => {
        if (stopWatch === 0) {
            stopWatch = timestamp;
        }
        elsapsedTime += timestamp - stopWatch;

        // elapsedTime / (1000 / 12) == elaspedTime * (12 / 1000)
        const passedFrames = elsapsedTime * FRAME_DURATION_MS_RECIPROCAL;
        const index = (passedFrames >> 0) % store.frames.length;
        setFrameIndex(index);

        if (isPlaying()) {
            handle = requestAnimationFrame(draw);
            stopWatch = timestamp;
        }
    };

    createEffect(() => setFrameIndex((f) => clamp(0, f, store.frames.length)));
    createCanvasUpdate(() => ctx, frameIndex);

    createEffect(() => {
        if (isPlaying()) {
            elsapsedTime = 0;
            stopWatch = 0;
            handle = window.requestAnimationFrame(draw);
        } else if (handle !== undefined) {
            window.cancelAnimationFrame(handle);
            handle = undefined;
        }
    });
    onCleanup(() => {
        if (handle !== undefined) {
            window.cancelAnimationFrame(handle);
        }
    });

    return (
        <section aria-labelledby="preview-label" data-layout="preview">
            <h2 id="preview-label">Preview</h2>
            <Container>
                <canvas
                    id="preview"
                    ref={(canvas: HTMLCanvasElement) => {
                        const context = canvas.getContext("2d");
                        if (context === null) {
                            throw new Error(
                                "Your device does not support rendering to a canvas. Please update your browser or switch to a device with canvas support."
                            );
                        }
                        ctx = context;
                    }}
                    height={CANVAS_LEN}
                    width={CANVAS_LEN}
                    aria-labelledby="preview-label"
                ></canvas>
            </Container>
            <Toolbar
                id="preview-toolbar"
                orientation="horizontal"
                controls="preview"
                labelledby="preview-label"
            >
                <ToolbarButton
                    compact
                    icon="skip-start"
                    text="Jump to first frame"
                    onClick={() => setFrameIndex(0)}
                    disabled={isPlaying()}
                />
                <ToolbarButton
                    compact
                    icon="skip-backward"
                    text="Jump to previous frame"
                    onClick={() =>
                        setFrameIndex((f) => {
                            const count = store.frames.length;
                            return (f - 1 + count) % count;
                        })
                    }
                    disabled={isPlaying()}
                />
                <ToolbarButton
                    compact
                    icon={isPlaying() ? "pause" : "play"}
                    text={isPlaying() ? "Pause" : "Play"}
                    onClick={() => setIsPlaying((isPlaying) => !isPlaying)}
                />
                <ToolbarButton
                    compact
                    icon="skip-forward"
                    text="Jump to next frame"
                    onClick={() => setFrameIndex((f) => (f + 1) % store.frames.length)}
                    disabled={isPlaying()}
                />
                <ToolbarButton
                    compact
                    icon="skip-end"
                    text="Jump to last frame"
                    onClick={() => setFrameIndex(store.frames.length - 1)}
                    disabled={isPlaying()}
                />
            </Toolbar>
        </section>
    );
};
