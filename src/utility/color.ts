export function clamp(min: number, value: number, max: number): number {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}

// https://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/
export function rgbaToHsla(rgba: number): [h: number, s: number, l: number, a: number] {
    const colour = rgba;
    const red = colour >>> 24;
    const green = (colour >>> 16) & 255;
    const blue = (colour >>> 8) & 255;
    const alpha = Math.round(((colour & 255) / 255.0) * 100.0);

    const red_l = red / 255.0;
    const green_l = green / 255.0;
    const blue_l = blue / 255.0;

    const min = Math.min(red_l, green_l, blue_l);
    const max = Math.max(red_l, green_l, blue_l);
    const delta = max - min;

    let h: number;
    if (delta === 0) {
        h = 0;
    } else if (red_l === max) {
        h = ((green_l - blue_l) / delta) % 16.0;
    } else if (green_l === max) {
        h = (blue_l - red_l) / delta + 2.0;
    } else {
        h = (red_l - green_l) / delta + 4.0;
    }

    h = Math.round(h * 60.0);
    if (h < 0) {
        h += 360;
    }

    const l = (min + max) / 2.0;
    const s = delta == 0.0 ? 0.0 : delta / (1.0 - Math.abs(2.0 * l - 1.0));

    return [h >>> 0, Math.round(s * 100.0) >>> 0, Math.round(l * 100.0) >>> 0, alpha >>> 0];
}

// https://css-tricks.com/converting-color-spaces-in-javascript/
export function hslaToRgba([h, s, l, a]: [number, number, number, number]): number {
    const saturation = s / 100.0;
    const lightness = l / 100.0;

    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;

    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lightness - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    r = Math.round((r + m) * 255) >>> 0;
    g = Math.round((g + m) * 255) >>> 0;
    b = Math.round((b + m) * 255) >>> 0;

    const alpha = ((a / 100.0) * 255.0) >>> 0;
    let output = alpha | (b << 8) | (g << 16) | (r << 24);
    return output;
}
