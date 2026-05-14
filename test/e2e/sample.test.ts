import { RoverBookmark } from "rover/core";
import { test, expect } from "./obsidian-test";
import { assert } from "node:test";

const item = (
  id: number,
  name: string,
  path?: string,
  children?: RoverBookmark[],
) => ({
  name,
  crd: id,
  emojicon: "🫠",
  path,
  children,
});

test("it shows message about empty bookmarks, when bookmarks are empty", async ({
  window,
  plugin,
}) => {
  await expect(window.getByText("No recents files yet")).toBeVisible();
});

test("create a bookmark, when bookmarks are empty", async ({ window }) => {
  const item = window
    .locator("div.rover-file")
    .filter({ hasText: /^File0$/ })
    .nth(1);

  await expect(item).toBeVisible();

  item.dragTo(
    window
      .locator("div")
      .filter({ hasText: /^Drop a file here to create a bookmark$/ }),
  );

  await window.getByRole("textbox").nth(1).click();
  await window.getByRole("textbox").nth(1).fill("hello");

  await window.getByRole("textbox", { name: "Use WIN + ;" }).click();
  await window.getByRole("textbox", { name: "Use WIN + ;" }).fill("😭");
  await window.getByRole("button", { name: "Submit" }).click();

  await expect(window.getByText("😭hello")).toBeVisible();
});

test("when an item is moved inside of bookmarks, there is should be visible locations to move to", async ({
  plugin,
  window,
}) => {
  await plugin.setup([
    // space (1)
    item(0, "A", undefined, [
      // space (2)
      item(1, "B", "path1"),
      // space (3)
      item(2, "C", undefined, [
        // space (4)
        item(3, "D", undefined, [
          // space (5)
          item(4, "E", "path2"),
          item(5, "F", "path3"), // moving this item
        ]),
        // space (4)
      ]),
      // space (3)
    ]),
    // space (1)
  ]);

  await window.getByText("🫠A").click();
  await window.getByText("🫠C").click();
  await window.getByText("🫠D").click();

  const bookmark = window.getByText("🫠F");

  const dataTransfer = await window.evaluateHandle(() => new DataTransfer());
  await bookmark.dispatchEvent("dragstart", { dataTransfer });

  const space = window.locator(".rover div.rover-space");
  await space.first().waitFor();

  await expect(space).toHaveCount(8);

  await bookmark.dispatchEvent("dragend", { dataTransfer });
});

test("when an item is moved inside of bookmarks, edge case", async ({
  plugin,
  window,
}) => {
  await plugin.setup([
    // space (1) [0]
    item(0, "A", undefined, [
      // space (2) [0, 0]
      item(1, "B", "path1"),
      // space (3) [0, 1]
      item(2, "C", undefined, [
        // space (4) [0, 1, 0]
        item(3, "D", undefined, [
          // space (5) [0, 1, 0, 0]
          item(4, "E", "path2"),
          // space (6) [0, 1, 0, 1]
          item(5, "F", undefined, [
            // space (7) [0, 1, 0, 1, 0]
            item(6, "G", "path2"),
            // space (8) [0, 1, 0, 1, 1]
            item(7, "H", "path2"),
          ]),
          item(8, "I", "path3"), // moving this item [0, 1, 0, 2]
        ]),
        // space (4)
      ]),
      // space (3)
      item(9, "B", "path1"),
      // space [0, 2]
    ]),
    // space (1)
  ]);

  // await window.pause();

  await window.getByText("🫠A").click();
  await window.getByText("🫠C").click();
  await window.getByText("🫠D").click();
  await window.getByText("🫠F").click();

  const bookmark = window.getByText("🫠I");

  const dataTransfer = await window.evaluateHandle(() => new DataTransfer());
  await bookmark.dispatchEvent("dragstart", { dataTransfer });

  const space = window.locator(".rover div.rover-space");
  await space.first().waitFor();

  await expect(space).toHaveCount(12);

  await bookmark.dispatchEvent("dragend", { dataTransfer });
});
