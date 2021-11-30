export const CANVAS_LEN = 16;
export const CANVAS_SIZE = CANVAS_LEN * CANVAS_LEN;
export const FPS = 12;
const HEADER = new TextEncoder().encode("PIXELRUN");

export function* readPXRBuffer(bytes: ArrayBuffer): Generator<Uint8ClampedArray> {
    const file = new DataView(bytes);
    let offset = 0;
    for (; offset < HEADER.length; offset++) {
        file.setUint8(offset, HEADER[offset]);
        const byte = file.getUint8(offset);
        if (byte !== HEADER[offset]) {
            throw new Error("Invalid file type.");
        }
    }
    if (file.getUint32(offset, false) !== CANVAS_LEN) {
        throw new Error("Unsupported canvas width.");
    }
    offset += 4;
    if (file.getUint32(offset, false) !== CANVAS_LEN) {
        throw new Error("Unsupported canvas height.");
    }
    offset += 4;
    if (file.getUint8(offset) !== FPS) {
        throw new Error("Unsupported refresh rate.");
    }
    offset += 1;

    try {
        const frameCount = file.getUint32(offset, false);
        offset += 4;
        const size = CANVAS_SIZE * 4;
        const buffer = file.buffer;

        for (let i = 0; i < frameCount; i++) {
            yield new Uint8ClampedArray(buffer.slice(offset, offset + size));
            offset += size;
        }
    } catch (error) {
        throw new Error(`Unable to read all frames. ${error}`);
    }
}

export function writePXRBuffer(frames: Uint8ClampedArray[]) {
    const buffer = new ArrayBuffer(
        HEADER.length +
            4 +
            4 +
            1 +
            4 +
            frames.reduce((acc: number, frame: Uint8ClampedArray) => acc + frame.length, 0)
    );
    const view = new DataView(buffer);
    let offset = 0;
    for (; offset < HEADER.length; offset++) {
        view.setUint8(offset, HEADER[offset]);
    }
    view.setUint32(offset, CANVAS_LEN, false);
    offset += 4;
    view.setUint32(offset, CANVAS_LEN, false);
    offset += 4;
    view.setUint8(offset, FPS);
    offset += 1;
    view.setUint32(offset, frames.length, false);
    offset += 4;
    for (const frame of frames) {
        for (const byte of frame) {
            view.setUint8(offset, byte);
            offset += 1;
        }
    }

    return view.buffer;
}
