import { JSXElement, onMount } from "solid-js";
import { IconSprite } from "../../assets/icons/definition";
import { Icon } from "./Icon";

export type Orientation = "horizontal" | "vertical";

interface ToolbarProps {
    // Toolbar specific properties
    controls: string;
    labelledby: string;
    orientation: Orientation;

    // Global properties
    id?: string;
    children: JSXElement;
}

export const Toolbar = (props: ToolbarProps) => {
    let toolbar: HTMLDivElement;
    let focusIndex = 0;

    // Automatically add first focusable element to tab order on mount
    onMount(() => {
        const firstFocusableElement = toolbar.querySelector("[tabIndex]") as HTMLElement;
        firstFocusableElement.tabIndex = 0;
    });

    const handleKeydown = (e: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
        if (
            (props.orientation === "horizontal" && e.key === "ArrowRight") ||
            (props.orientation === "vertical" && e.key === "ArrowDown")
        ) {
            focusIndex += 1;
        } else if (
            (props.orientation === "horizontal" && e.key === "ArrowLeft") ||
            (props.orientation === "vertical" && e.key === "ArrowUp")
        ) {
            focusIndex -= 1;
        } else {
            return;
        }

        const focusableElements = e.currentTarget.querySelectorAll(
            "[tabIndex]"
        ) as NodeListOf<HTMLElement>;

        // Set focus on next element and add to tab order
        focusIndex = Math.min(Math.max(focusIndex, 0), focusableElements.length - 1);
        // Focus will set index
        focusableElements[focusIndex].focus();

        // Prevent scrolling
        e.preventDefault();
    };

    const handleFocus = (e: FocusEvent & { currentTarget: HTMLDivElement }) => {
        const focusableElements = e.currentTarget.querySelectorAll(
            "[tabIndex]"
        ) as NodeListOf<HTMLElement>;
        for (let i = 0; i < focusableElements.length; i++) {
            if (e.target === focusableElements[i]) {
                // Remove previous element from tab order
                focusableElements[focusIndex].tabIndex = -1;

                // Add target element to tab order
                (e.target as HTMLElement).tabIndex = 0;

                // Save current index
                focusIndex = i;
                break;
            }
        }
    };

    return (
        <div
            ref={toolbar}
            id={props.id}
            role="toolbar"
            aria-orientation={props.orientation}
            aria-controls={props.controls}
            aria-labelledby={props.labelledby}
            onKeyDown={handleKeydown}
            onFocus={handleFocus}
        >
            {props.children}
        </div>
    );
};

interface ToolbarButtonProps {
    text: string;
    icon: IconSprite;
    disabled?: boolean;
    onClick: () => void;
    compact?: boolean;
}

export const ToolbarButton = (props: ToolbarButtonProps) => {
    return (
        <button
            tabIndex={-1}
            aria-disabled={props.disabled}
            onClick={() => {
                if (!props.disabled) {
                    props.onClick();
                }
            }}
        >
            <Icon source={props.icon} />
            <span class={props.compact === true ? "visually-hidden" : "btn-label"}>
                {props.text}
            </span>
        </button>
    );
};
