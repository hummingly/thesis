import { JSXElement, onCleanup } from "solid-js";

interface ContainerProps {
    children: JSXElement;
}

export const Container = (props: ContainerProps) => {
    const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        const canvasDimension = Math.min(width, height);
        (entry.target as HTMLElement).style.setProperty(
            "--container-dimension",
            `${canvasDimension.toFixed(0)}px`
        );
    });
    onCleanup(() => observer.disconnect());

    return (
        <div class="container" ref={(container: HTMLDivElement) => observer.observe(container)}>
            <div class="container-content">{props.children}</div>
        </div>
    );
};
