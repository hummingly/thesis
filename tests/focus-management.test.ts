import { expect, Page, test } from "@playwright/test";
import { PORT } from "./index";

test("Focus Management", async ({ page }) => {
    await page.goto(`http://localhost:${PORT}`);

    await page.locator("text=File").first().waitFor();

    // Focus menu
    await page.keyboard.press("Tab");
    const fileEntry = await expectNode(page, {
        name: "File",
        focused: true,
    });
    expect(fileEntry.role).toContain("menuitem");
    expect(fileEntry.haspopup === true || fileEntry.haspopup === "menu").toBe(true);

    // Focus tools
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "radio",
        name: "Pen",
        focused: true,
        checked: true,
    });

    // Focus hue input
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "slider",
        name: "Hue",
        focused: true,
    });
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "spinbutton",
        name: "Hue",
        focused: true,
    });

    // Focus saturation input
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "slider",
        name: "Saturation",
        focused: true,
    });
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "spinbutton",
        name: "Saturation",
        focused: true,
    });

    // Focus lightness input
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "slider",
        name: "Lightness",
        focused: true,
    });
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "spinbutton",
        name: "Lightness",
        focused: true,
    });

    // Focus alpha input
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "slider",
        name: "Alpha",
        focused: true,
    });
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "spinbutton",
        name: "Alpha",
        focused: true,
    });

    // Focus preview toolbar
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "button",
        name: "Jump to first frame",
        focused: true,
    });

    // Focus frames toolbar
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "button",
        name: "Add",
        focused: true,
    });

    // Focus frames
    await page.keyboard.press("Tab");
    await expectNode(page, {
        role: "option",
        name: "1",
        focused: true,
    });
});

async function expectNode(
    page: Page,
    partialMatch: Record<string, unknown>
): Promise<AccessibilityNode> {
    const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
    const node = findFocusedNode(snapshot!);
    expect(node).toEqual(expect.objectContaining(partialMatch));
    return node!;
}

function findFocusedNode(node: AccessibilityNode): AccessibilityNode | null {
    if (node.focused) {
        return node;
    }
    for (const child of node.children || []) {
        const foundNode = findFocusedNode(child);
        if (!foundNode) {
            continue;
        }
        return foundNode;
    }
    return null;
}

// Somebody forgot to make it public...
type AccessibilityNode = {
    role: string;
    name: string;
    value?: string | number;
    description?: string;
    keyshortcuts?: string;
    roledescription?: string;
    valuetext?: string;
    disabled?: boolean;
    expanded?: boolean;
    focused?: boolean;
    modal?: boolean;
    multiline?: boolean;
    multiselectable?: boolean;
    readonly?: boolean;
    required?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    pressed?: boolean | "mixed";
    level?: number;
    valuemin?: number;
    valuemax?: number;
    autocomplete?: string;
    haspopup?: string | boolean;
    invalid?: string;
    orientation?: string;
    children?: AccessibilityNode[];
};
