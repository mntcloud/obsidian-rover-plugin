import m from "mithril";
import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { ListBookmarks } from "rover/view/components/Bookmarks/ListBookmarks";
import { JSDOM } from "jsdom";
import { RoverBookmark } from "rover/core.js";
import { Bookmarks } from "rover/view/models";

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

//
// TODO: redesign tests to use JSDOM and node-test-runner
//

describe("DOM: pointing out a free space, when user is moving a grabbed bookmark", () => {
  const dom = new JSDOM("<!DOCTYPE html>", {
    pretendToBeVisual: true,
  });

  const Root = {
    view: function () {
      return m(ListBookmarks, {
        inheritedPosition: [],
        items: Bookmarks.items,
        nest: -1,
      });
    },
  };

  before(async () => {
    // @ts-expect-error "we need to setup JSDOM"
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;

    // @ts-expect-error "import polyfills"
    await import("./dragevent.polyfill.js");

    document.body.innerHTML = `<div id="root"></div>`;
  });

  after(() => {
    dom.window.close();
  });

  test("complex structures", () => {
    Bookmarks.isTesting = true;
    Bookmarks.items = [
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
    ];

    const root = document.getElementById("root")!;

    m.render(root, m(Root));

    const bookmark = root.querySelector(
      `.rover-bookmark-item[data-crd="5"]`,
    )! as HTMLElement;

    // Almost the same process, like with m.mount()
    const event = new window.DragEvent("dragstart", { bubbles: true });
    bookmark.dispatchEvent(event);
    m.render(root, m(Root)); // to update flat position inside of elements after dragstart
    m.render(root, m(Root)); // to update views of elements

    const highlights = root.querySelectorAll<HTMLElement>(`.rover-space`);

    assert.strictEqual(highlights.length, 8);
  });

  test("complex case with nested structures, that are maybe neighbors to our moving item", () => {
    Bookmarks.isTesting = true;
    Bookmarks.items = [
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
    ];

    const root = document.getElementById("root")!;

    m.render(root, m(Root));

    const bookmark = root.querySelector(
      `.rover-bookmark-item[data-crd="8"]`,
    )! as HTMLElement;

    // Almost the same process, like with m.mount()
    const event = new window.DragEvent("dragstart", { bubbles: true });
    bookmark.dispatchEvent(event);
    m.render(root, m(Root)); // to update flat position inside of elements after dragstart
    m.render(root, m(Root)); // to update views of elements

    const highlights = root.querySelectorAll<HTMLElement>(`.rover-space`);

    assert.strictEqual(highlights.length, 12);
  });
});
