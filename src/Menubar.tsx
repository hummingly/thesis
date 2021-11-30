import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useAppState } from "./AppState";

export const Menubar = () => {
    let menubar: HTMLUListElement;
    let fileMenu: HTMLButtonElement;
    let menuItems: HTMLLIElement[];
    let focus = 0;
    const [_, { loadFile, saveFile }] = useAppState();
    const [isOpen, setIsOpen] = createSignal(false);

    const close = () => setIsOpen(false);

    const closeDialog = (e: KeyboardEvent) => {
        if (isOpen() && e.key === "Escape") {
            close();
        }
    };

    onMount(() => {
        window.addEventListener("keydown", closeDialog, true);
        menuItems = [
            ...(menubar.querySelectorAll("li[role='menuitem']") as NodeListOf<HTMLLIElement>),
        ];
    });
    onCleanup(() => window.removeEventListener("keydown", closeDialog, true));

    createEffect(() => {
        if (isOpen()) {
            menuItems[0].tabIndex = 0;
            menuItems[0].focus();
        } else if (menuItems[focus].tabIndex === 0) {
            menuItems[focus].tabIndex = -1;
            focus = 0;
            fileMenu.focus();
        }
    });

    const save = () => {
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        const blob = new Blob([saveFile()], {
            type: "text/plain",
        });
        const url = URL.createObjectURL(blob);
        anchor.href = url;
        anchor.download = "animation.pxr";
        anchor.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
    };

    const load = (e: Event & { currentTarget: HTMLInputElement; target: Element }) => {
        const file = e.currentTarget.files?.[0];
        if (!file?.name.endsWith(".pxr")) {
            return;
        }
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
            if (e.target?.result instanceof ArrayBuffer) {
                try {
                    loadFile(e.target.result);
                } catch (error) {
                    alert(`An error occured while loading the file ${file.name}: ${error}`);
                }
            }
        };
    };

    const handleBlur = (e: FocusEvent & { currentTarget: HTMLElement }) => {
        if (
            e.currentTarget !== e.relatedTarget &&
            e.relatedTarget !== fileMenu &&
            !e.currentTarget.contains(e.relatedTarget as Node)
        ) {
            close();
        }
    };

    return (
        <ul ref={menubar} role="menubar" data-layout="menubar" onfocusout={handleBlur}>
            <li role="none">
                <button
                    ref={fileMenu}
                    id="file-menu"
                    role="menuitem"
                    aria-haspopup="true"
                    aria-expanded={isOpen()}
                    tabIndex={isOpen() ? -1 : 0}
                    onClick={(e: MouseEvent) => {
                        e.preventDefault();
                        setIsOpen((value) => !value);
                    }}
                    onKeyDown={(e: KeyboardEvent) => {
                        if (e.key === "ArrowDown" || e.key === "Enter") {
                            setIsOpen(true);
                        }
                    }}>
                    File
                </button>
                <ul
                    role="menu"
                    aria-labelledby="file-menu"
                    onClick={close}
                    onKeyDown={(e) => {
                        const currentFocus = focus;
                        if (e.key === "ArrowUp") {
                            focus = (focus - 1 + menuItems.length) % menuItems.length;
                        } else if (e.key === "ArrowDown") {
                            focus = (focus + 1) % menuItems.length;
                        } else if (e.key === "Enter") {
                            menuItems[currentFocus].click();
                            return;
                        } else {
                            return;
                        }
                        menuItems[currentFocus].tabIndex = -1;
                        menuItems[focus].tabIndex = 0;
                        menuItems[focus].focus();
                    }}>
                    <li
                        role="menuitem"
                        onClick={(e: MouseEvent & { currentTarget: HTMLElement }) =>
                            (e.currentTarget.firstElementChild as HTMLElement).click()
                        }
                        tabIndex={-1}>
                        Open File...
                        <input
                            class="visually-hidden"
                            aria-hidden="true"
                            tabIndex={-1}
                            type="file"
                            onChange={load}
                            accept=".pxr"
                        />
                    </li>
                    <li role="menuitem" onClick={save} tabIndex={-1}>
                        Save File...
                    </li>
                </ul>
            </li>
        </ul>
    );
};
