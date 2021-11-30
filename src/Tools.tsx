import { createEffect, createSignal, JSXElement } from "solid-js";

import { Orientation } from "./components/Toolbar";
import { Colour } from "./Colour";
import { Tool, useAppState } from "./AppState";
import { getId } from "./components/id";
import { IconSprite } from "../assets/icons/definition";
import { Icon } from "./components/Icon";

export const Tools = () => {
    let mediaQuery = window.matchMedia(
        "screen and (min-width: 1000px) and (min-aspect-ratio: 7 / 8)"
    );
    const [orientation, setOrientation] = createSignal<Orientation>(
        mediaQuery.matches ? "vertical" : "horizontal"
    );
    mediaQuery.addEventListener(
        "change",
        (e) => setOrientation(e.matches ? "vertical" : "horizontal"),
        true
    );
    const isCollapsed = () => orientation() === "horizontal";
    const style = () => ({ display: isCollapsed() ? "flex" : undefined });

    return (
        <div data-layout="tools" style={style()}>
            <ActiveTools orientation={orientation()} />
            <Colour isCollapsed={isCollapsed()} />
        </div>
    );
};

const ActiveTools = (props: { orientation: Orientation }) => {
    const [store, { activatePen, activateEraser, activateEyedropper }] = useAppState();

    return (
        <section aria-labelledby="tools-label">
            <h2 id="tools-label">Tools</h2>
            <ToolbarRadioGroup labelledby="tools-label" orientation={props.orientation}>
                <ToolbarRadioButton
                    icon="pencil"
                    text="Pen"
                    checked={store.activeTool === Tool.Pen}
                    onClick={activatePen}
                />
                <ToolbarRadioButton
                    icon="eraser"
                    text="Eraser"
                    checked={store.activeTool === Tool.Eraser}
                    onClick={activateEraser}
                />
                <ToolbarRadioButton
                    icon="eyedropper"
                    text="Eyedropper"
                    checked={store.activeTool === Tool.Eyedropper}
                    onClick={activateEyedropper}
                />
            </ToolbarRadioGroup>
        </section>
    );
};

interface ToolbarRadioGroupProps {
    orientation: Orientation;
    labelledby: string;
    children?: JSXElement;
}

const ToolbarRadioGroup = (props: ToolbarRadioGroupProps) => {
    const handleKeydown = (e: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
        let nextElement: HTMLElement;
        const currentElement = e.target as HTMLElement;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            nextElement = (currentElement.nextElementSibling ??
                e.currentTarget.firstElementChild) as HTMLElement;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            nextElement = (currentElement.previousElementSibling ??
                e.currentTarget.lastElementChild) as HTMLElement;
        } else {
            return;
        }
        nextElement.click();
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <div
            role="radiogroup"
            aria-labelledby={props.labelledby}
            aria-orientation={props.orientation}
            onKeyDown={handleKeydown}
        >
            {props.children}
        </div>
    );
};

interface ToolbarRadioButtonProps {
    checked: boolean;
    icon: IconSprite;
    text: string;
    onClick: () => void;
}

const ToolbarRadioButton = (props: ToolbarRadioButtonProps) => {
    let radio: HTMLButtonElement;
    const id = `__toolbar-radio-button-${getId()}`;
    const tabIndex = () => (props.checked ? 0 : -1);
    createEffect((previous) => {
        const next = tabIndex();
        if (next !== previous && props.checked) {
            radio.focus();
        }
        return next;
    }, tabIndex());

    return (
        <button
            ref={radio}
            id={id}
            tabIndex={-1}
            role="radio"
            aria-checked={props.checked}
            aria-labelledby={id} // visible label
            onClick={props.onClick}
            tabindex={tabIndex()}
        >
            <Icon source={props.icon} />
            <span class="btn-label">{props.text}</span>
        </button>
    );
};
