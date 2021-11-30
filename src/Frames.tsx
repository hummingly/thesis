import { Accessor, createEffect, createMemo, For } from "solid-js";
import { Toolbar, ToolbarButton } from "./components/Toolbar";
import { useAppState } from "./AppState";
import { Frame as FrameData } from "./Frame";
import { CANVAS_LEN } from "./utility/data";

export const Frames = () => {
    return (
        <section aria-labelledby="frames-label" data-layout="frames">
            <h2 id="frames-label">Frames</h2>
            <FramesTools />
            <FrameList />
        </section>
    );
};

const FramesTools = () => {
    const [store, { addFrame, duplicateFrame, deleteFrame, moveFrameLeft, moveFrameRight }] =
        useAppState();
    const canMoveLeft = () => store.selectedFrame === 0;
    const canMoveRight = () => store.selectedFrame === store.frames.length - 1;
    const canDelete = () => store.frames.length <= 1;

    return (
        <Toolbar orientation="horizontal" controls="animation-frames" labelledby="frames-label">
            <ToolbarButton icon="plus-square" text="Add" onClick={addFrame} />
            <ToolbarButton icon="front" text="Duplicate" onClick={duplicateFrame} />
            <ToolbarButton
                icon="box-arrow-left"
                text="Move to Left"
                disabled={canMoveLeft()}
                onClick={moveFrameLeft}
            />
            <ToolbarButton
                icon="box-arrow-right"
                text="Move to Right"
                disabled={canMoveRight()}
                onClick={moveFrameRight}
            />
            <ToolbarButton
                icon="trash"
                text="Delete"
                disabled={canDelete()}
                onClick={deleteFrame}
            />
        </Toolbar>
    );
};

const FrameList = () => {
    const [store, { editFrame }] = useAppState();

    const handleKeydown = (e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowRight":
                editFrame(Math.min(store.selectedFrame + 1, store.frames.length - 1));
                break;

            case "ArrowLeft":
                editFrame(Math.max(store.selectedFrame - 1, 0));
                break;

            case "Home":
                e.preventDefault();
                editFrame(0);
                break;

            case "End":
                e.preventDefault();
                editFrame(store.frames.length - 1);

            default:
                break;
        }
    };

    return (
        <ul
            id="animation-frames"
            role="listbox"
            aria-orientation="horizontal"
            aria-labelledby="frames-label"
            onKeyDown={handleKeydown}
        >
            <For each={store.frames}>
                {(frame, frameIndex) => <Frame data={frame} frameIndex={frameIndex} />}
            </For>
        </ul>
    );
};

interface FrameProps {
    data: FrameData;
    frameIndex: Accessor<number>;
}

const Frame = (props: FrameProps) => {
    let option: HTMLLIElement;
    const [store, { editFrame, createCanvasUpdate }] = useAppState();
    const isSelected = createMemo(() =>
        (store.selectedFrame === props.frameIndex()) === true ? true : undefined
    );
    const frame = () => props.frameIndex() + 1;

    let ctx: CanvasRenderingContext2D;
    createCanvasUpdate(() => ctx, props.frameIndex);

    const tabIndex = () => (isSelected() ? 0 : -1);
    createEffect((previous) => {
        const next = tabIndex();
        if (next === previous) {
            return next;
        } else if (next === 0) {
            option.focus();
        }
        return next;
    }, tabIndex());

    return (
        <li
            ref={option}
            role="option"
            aria-selected={isSelected()}
            onClick={() => editFrame(props.frameIndex())}
            tabIndex={tabIndex()}
        >
            <canvas
                aria-hidden="true"
                height={CANVAS_LEN}
                width={CANVAS_LEN}
                ref={(canvas: HTMLCanvasElement) => {
                    const context = canvas.getContext("2d");
                    if (context === null) {
                        throw new Error(
                            "Your device does not support rendering to a canvas. Please update your browser or switch to a device with canvas support."
                        );
                    }
                    ctx = context;
                }}
                class="thumbnail"
            ></canvas>
            <span class="frame-index">{frame()}</span>
        </li>
    );
};
