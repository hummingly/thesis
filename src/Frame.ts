import { CANVAS_LEN, CANVAS_SIZE } from "./utility/data";

export type Frame = {
    dirty: boolean;
    readonly bytes: Uint8ClampedArray;
    readonly image: ImageData;
};

export function createFrame(): Frame {
    return createFrameFrom(new Uint8ClampedArray(CANVAS_SIZE * 4));
}

export function createFrameFrom(bytes: Uint8ClampedArray): Frame {
    return {
        dirty: false,
        bytes,
        image: new ImageData(bytes, CANVAS_LEN, CANVAS_LEN),
    };
}

export function get(frame: Frame, index: number): number {
    const buffer = frame.bytes;
    const offset = index * 4;
    const alpha = buffer[offset + 3] >>> 0;
    const blue = buffer[offset + 2] << 8;
    const green = buffer[offset + 1] << 16;
    const red = buffer[offset] << 24;
    return red | green | blue | alpha;
}

export function set(frame: Frame, index: number, colour: number) {
    const buffer = frame.bytes;
    const offset = index * 4;
    buffer[offset + 3] = colour & 255; // alpha
    buffer[offset + 2] = (colour >>> 8) & 255; // blue
    buffer[offset + 1] = (colour >>> 16) & 255; // green
    buffer[offset] = colour >>> 24; // red
}

export function clear(frame: Frame, index: number) {
    const buffer = frame.bytes;
    const offset = index * 4;
    buffer[offset + 3] = 0;
    buffer[offset + 2] = 0;
    buffer[offset + 1] = 0;
    buffer[offset] = 0;
}

export function clone(frame: Frame): Frame {
    return createFrameFrom(frame.bytes.slice());
}
