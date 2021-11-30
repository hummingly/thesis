import { createPopper, Instance } from "@popperjs/core";
import { batch, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Tool, useAppState } from "./AppState";
import { clamp, rgbaToHsla } from "./utility/color";

export const Colour = (props: { isCollapsed: boolean }) => {
    return (
        <section aria-labelledby="colour-label">
            <h2 id="colour-label">Colour</h2>
            {props.isCollapsed ? <ColourDialog /> : <ColourPicker />}
        </section>
    );
};

const ColourPicker = () => {
    const [store, { setActiveColour }] = useAppState();
    const [h, s, l, a] = rgbaToHsla(store.activeColour);
    const [hue, setHue] = createSignal(h);
    const [saturation, setSaturation] = createSignal(s);
    const [lightness, setLightness] = createSignal(l);
    const [alpha, setAlpha] = createSignal(a);

    const handleDraw = ((e: CustomEvent<{ tool: Tool; colour: number }>) => {
        const { tool, colour } = e.detail;
        if (tool === Tool.Eyedropper) {
            const [h, s, l, a] = rgbaToHsla(colour);
            batch(() => {
                setHue(h);
                setSaturation(s);
                setLightness(l);
                setAlpha(a);
            });
        }
    }) as (e: Event) => void;

    onMount(() => window.addEventListener("draw", handleDraw));
    onCleanup(() => window.removeEventListener("draw", handleDraw));

    createEffect(() => setActiveColour([hue(), saturation(), lightness(), alpha()]));

    const handleHue = (e: Event & { currentTarget: HTMLInputElement }) => {
        const hue = clamp(0, e.currentTarget.valueAsNumber, 359);
        setHue(hue);
    };

    const handleStaturation = (e: Event & { currentTarget: HTMLInputElement }) => {
        const saturation = clamp(0, e.currentTarget.valueAsNumber, 100);
        setSaturation(saturation);
    };

    const handleLightness = (e: Event & { currentTarget: HTMLInputElement }) => {
        const lightness = clamp(0, e.currentTarget.valueAsNumber, 100);
        setLightness(lightness);
    };

    const handleAlpha = (e: Event & { currentTarget: HTMLInputElement }) => {
        const alpha = clamp(0, e.currentTarget.valueAsNumber, 100);
        setAlpha(alpha);
    };

    return (
        <>
            <div class="colour-preview">
                <div
                    style={{
                        "height": "100%",
                        "width": "100%",
                        "background-color": `hsl(${hue()}, ${saturation()}%, ${lightness()}%, ${
                            alpha() / 100
                        })`,
                    }}
                ></div>
            </div>

            <div class="colour-input">
                <label id="hue-label" for="hue-input">
                    Hue
                </label>
                <input
                    id="hue-input"
                    type="range"
                    min={0}
                    max={360}
                    value={hue()}
                    onInput={handleHue}
                />
                <input
                    aria-labelledby="hue-label"
                    type="number"
                    role="spinbutton"
                    min={0}
                    max={360}
                    value={hue()}
                    onInput={handleHue}
                />

                <label id="saturation-label" for="saturation-input">
                    Saturation
                </label>
                <input
                    id="saturation-input"
                    type="range"
                    min={0}
                    max={100}
                    value={saturation()}
                    onInput={handleStaturation}
                />
                <input
                    aria-labelledby="saturation-label"
                    type="number"
                    role="spinbutton"
                    min={0}
                    max={100}
                    value={saturation()}
                    onInput={handleStaturation}
                />

                <label id="lightness-label" for="lightness-input">
                    Lightness
                </label>
                <input
                    id="lightness-input"
                    type="range"
                    min={0}
                    max={100}
                    value={lightness()}
                    onInput={handleLightness}
                />
                <input
                    aria-labelledby="lightness-label"
                    type="number"
                    role="spinbutton"
                    min={0}
                    max={100}
                    value={lightness()}
                    onInput={handleLightness}
                />

                <label id="alpha-label" for="alpha-input">
                    Alpha
                </label>
                <input
                    id="alpha-input"
                    type="range"
                    min={0}
                    max={100}
                    value={alpha()}
                    onInput={handleAlpha}
                />
                <input
                    aria-labelledby="alpha-label"
                    type="number"
                    role="spinbutton"
                    min={0}
                    max={100}
                    value={alpha()}
                    onInput={handleAlpha}
                />
            </div>
        </>
    );
};

const ColourDialog = () => {
    let dialog: HTMLDivElement;
    let button: HTMLButtonElement;
    let firstElement: HTMLInputElement;
    let lastElement: HTMLInputElement;
    let popperInstance: Instance;
    const [isOpen, setIsOpen] = createSignal(false);

    const close = () => {
        setIsOpen(false);
        button.focus();
    };

    const closeDialog = (e: KeyboardEvent) => {
        if (isOpen() && e.key === "Escape") {
            close();
        }
    };

    onMount(() => {
        window.addEventListener("keydown", closeDialog, true);
        const inputs = dialog.querySelectorAll("input");
        firstElement = inputs[0];
        lastElement = inputs[inputs.length - 1];

        popperInstance = createPopper(button, dialog, {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "preventOverflow",
                    options: { boundary: document.body },
                },
            ],
        });
    });
    onCleanup(() => {
        window.removeEventListener("keydown", closeDialog, true);
        popperInstance.destroy();
    });

    createEffect(() => {
        if (isOpen()) {
            firstElement.focus();
            popperInstance.forceUpdate();
        }
    });

    const trapFocus = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
            if (e.shiftKey && e.target === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && e.target === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    const handleBlur = (e: FocusEvent & { currentTarget: HTMLDivElement }) => {
        if (
            e.currentTarget !== e.relatedTarget &&
            e.relatedTarget !== button &&
            !e.currentTarget.contains(e.relatedTarget as Node)
        ) {
            close();
        }
    };

    return (
        <>
            <button
                style={{ padding: "0.25rem" }}
                ref={button}
                onClick={() => setIsOpen((v) => !v)}
            >
                <div
                    style={{
                        "width": "2rem",
                        "height": "2rem",
                        "background":
                            "conic-gradient(hsl(360, 100%, 50%),hsl(315, 100%, 50%),hsl(270, 100%, 50%),hsl(225, 100%, 50%),hsl(180, 100%, 50%),hsl(135, 100%, 50%),hsl(90, 100%, 50%),hsl(45, 100%, 50%),hsl(0, 100%, 50%))",
                        "border-radius": "50%",
                    }}
                ></div>
                <span class="visually-hidden">Choose Colour</span>
            </button>
            <div
                ref={dialog}
                role="dialog"
                aria-labelledby="colour-label"
                aria-modal="true"
                aria-live="polite"
                data-open={isOpen()}
                onfocusout={handleBlur}
            >
                <div tabIndex={-1} class="dialog-content" onKeyDown={trapFocus}>
                    <ColourPicker />
                </div>
            </div>
        </>
    );
};
