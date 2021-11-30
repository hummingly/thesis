import { batch, createContext, createEffect, on, useContext } from "solid-js";
import { createStore, produce, Store } from "solid-js/store";

import { Frame, createFrame, createFrameFrom, get, set, clear, clone } from "./Frame";
import { hslaToRgba } from "./utility/color";
import { readPXRBuffer, writePXRBuffer } from "./utility/data";

export const enum Tool {
    Pen,
    Eyedropper,
    Eraser,
}

interface AppModel {
    activeTool: Tool;
    activeColour: number;
    readonly frames: Array<Frame>;
    selectedFrame: number;
}

export const AppStateContext = createContext<[Store<AppModel>, Methods]>([{}, {}] as any);

export const AppStateProvider = (props: { children: any }) => {
    const [state, setState] = createStore<AppModel>({
        activeTool: Tool.Pen,
        activeColour: hslaToRgba([0, 50, 50, 100]),
        frames: [createFrame()],
        selectedFrame: 0,
    });

    const methods = {
        setActiveColour: (hsla: [number, number, number, number]) =>
            setState("activeColour", hslaToRgba(hsla)),
        activatePen: () => setState("activeTool", Tool.Pen),
        activateEraser: () => setState("activeTool", Tool.Eraser),
        activateEyedropper: () => setState("activeTool", Tool.Eyedropper),
        draw: (pixelIndex: number) => {
            const selectionIndex = state.selectedFrame;
            const selectedFrame = state.frames[selectionIndex];
            switch (state.activeTool) {
                case Tool.Pen: {
                    const colour = state.activeColour;
                    set(selectedFrame, pixelIndex, colour);
                    setState("frames", selectionIndex, "dirty", (d) => !d);
                    break;
                }

                case Tool.Eraser: {
                    clear(selectedFrame, pixelIndex);
                    setState("frames", selectionIndex, "dirty", (d) => !d);
                    break;
                }

                case Tool.Eyedropper: {
                    setState("activeColour", get(selectedFrame, pixelIndex));
                    break;
                }

                default:
                    break;
            }
        },
        addFrame: () => insertFrame(createFrame()),
        editFrame: (frameIndex: number) => setState("selectedFrame", frameIndex),
        deleteFrame: () => {
            if (state.frames.length <= 1) {
                return;
            }
            if (state.selectedFrame === 0) {
                setState("frames", produceShift<Frame>());
            } else if (state.selectedFrame === state.frames.length - 1) {
                batch(() => {
                    setState("frames", producePop<Frame>());
                    setState("selectedFrame", state.frames.length - 1);
                });
            } else {
                setState("frames", produceDelete<Frame>(state.selectedFrame));
            }
        },
        duplicateFrame: () => insertFrame(clone(state.frames[state.selectedFrame])),
        moveFrameLeft: () => {
            if (state.selectedFrame > 0) {
                moveFrame(-1);
            }
        },
        moveFrameRight: () => {
            if (state.selectedFrame < state.frames.length - 1) {
                moveFrame(1);
            }
        },
        saveFile: (): ArrayBuffer => {
            return writePXRBuffer(state.frames.map((f) => f.bytes));
        },
        loadFile: (bytes: ArrayBuffer) => {
            setState(
                "frames",
                Array.from(readPXRBuffer(bytes), (bytes) => createFrameFrom(bytes))
            );
        },
        createCanvasUpdate: (ctx: () => CanvasRenderingContext2D, frameIndex: () => number) => {
            createEffect(
                on(
                    () => {
                        const index = frameIndex();
                        const _ = state.frames[index].dirty;
                        return index;
                    },
                    (index) => ctx().putImageData(state.frames[index].image, 0, 0)
                )
            );
        },
    };

    function insertFrame(frame: Frame) {
        const index = state.selectedFrame + 1;
        batch(() => {
            setState("selectedFrame", index);
            setState("frames", produceInsert(index, frame));
        });
    }

    function moveFrame(offset: number) {
        const current = state.selectedFrame;
        const index = current + offset;
        batch(() => {
            setState("frames", produceSwap<Frame>(current, index));
            setState("selectedFrame", index);
        });
    }

    return (
        <AppStateContext.Provider value={[state, methods]}>
            {props.children}
        </AppStateContext.Provider>
    );
};

type Methods = {
    setActiveColour: (hsla: [number, number, number, number]) => void;
    activatePen: () => void;
    activateEraser: () => void;
    activateEyedropper: () => void;
    draw: (pixelIndex: number) => void;
    addFrame: () => void;
    editFrame: (frameIndex: number) => void;
    deleteFrame: () => void;
    duplicateFrame: () => void;
    moveFrameLeft: () => void;
    moveFrameRight: () => void;
    saveFile: () => ArrayBuffer;
    loadFile: (bytes: ArrayBuffer) => void;
    createCanvasUpdate: (ctx: () => CanvasRenderingContext2D, frameIndex: () => number) => void;
};

export function useAppState(): [Store<AppModel>, Methods] {
    return useContext(AppStateContext);
}

function produceInsert<T>(start: number, item: T) {
    return produce((array: Array<T>) => array.splice(start, 0, item));
}

function produceDelete<T>(index: number) {
    return produce((array: Array<T>) => array.splice(index, 1));
}

function produceShift<T>() {
    return produce((array: Array<T>) => array.shift());
}

function producePop<T>() {
    return produce((array: Array<T>) => array.pop());
}

function produceSwap<T>(a: number, b: number) {
    return produce((array: Array<T>) => {
        const temp = array[a];
        array[a] = array[b];
        array[b] = temp;
    });
}
