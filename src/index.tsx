import { render } from "solid-js/web";
import { Pixels } from "./Pixels";
import { Frames } from "./Frames";
import { Tools } from "./Tools";
import { Preview } from "./Preview";
import { Menubar } from "./Menubar";
import { AppStateProvider } from "./AppState";
import { onMount } from "solid-js";

const App = () => {
    onMount(() => {
        const preventEvent = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("dragstart", preventEvent, true);
    });

    return (
        <AppStateProvider>
            <Menubar />
            <Tools />
            <Pixels />
            <Preview />
            <Frames />
        </AppStateProvider>
    );
};

render(() => <App />, document.getElementById("app")!);
