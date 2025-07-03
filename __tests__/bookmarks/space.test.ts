/**
 * @jest-environment jsdom
 */

import m from "mithril";
import { RoverBookmark } from "view/models/data/Base";
import { Bookmarks } from "view/models/BookmarksModel";
import { Root } from "../misc/root.component";

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

describe("DOM: pointing out a free space on bookmark movement", () => {
    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
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
        const event = new DragEvent("dragstart", { bubbles: true });
        bookmark.dispatchEvent(event);
        m.render(root, m(Root)); // to update flat position inside of elements after dragstart
        m.render(root, m(Root)); // to update views of elements

        const highlights = root.querySelectorAll<HTMLElement>(`.rover-space`);

        expect(highlights.length).toBe(8);
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
        const event = new DragEvent("dragstart", { bubbles: true });
        bookmark.dispatchEvent(event);
        m.render(root, m(Root)); // to update flat position inside of elements after dragstart
        m.render(root, m(Root)); // to update views of elements

        const highlights = root.querySelectorAll<HTMLElement>(`.rover-space`);

        expect(highlights.length).toBe(12);
    });
});

// describe("HighlightSpace", () => {
//     beforeAll(() => {
//         document.body.innerHTML =
//             `<div id="root">
//        </div>`
//     })

//     test("highlights free space when element is dragged", () => {
//         Bookmarks.isTesting = true
//         Bookmarks.items = [
//             // highlight
//             {
//                 // 0
//                 "crd": 1737555158000,
//                 "name": "deadmonger",
//                 "emojicon": "😶‍🌫️",
//                 "children": [
//                     // highlight
//                     {
//                         // 0
//                         "crd": 1737555153004,
//                         "name": "Мысли",
//                         "emojicon": "🫠",
//                         "path": "_nofilter/22 January '25.md"
//                     },
//                     // highlight
//                     {
//                         // 1
//                         "crd": 1737555158200,
//                         "name": "lol",
//                         "emojicon": "🫠",
//                         "children": [
//                             // highlight
//                             {
//                                 // 0
//                                 "crd": 1737555158250,
//                                 "name": "lol2",
//                                 "emojicon": "🖼️",
//                                 "path": "_nofilter/27 January '25 ~ 2.md"
//                             }
//                         ]
//                     },
//                 ]
//             },
//             // highlight
//             {
//                 // 1
//                 "crd": 1737555152222,
//                 "name": "folder2",
//                 "emojicon": "👽",
//                 "children": [
//                     // no highlight 0
//                     {
//                         // 0
//                         "crd": 1737555153124,
//                         "name": "hey",
//                         "emojicon": "🫠",
//                         "path": "_nofilter/22 January '25.md"
//                     },
//                     // no highlight
//                     {
//                         // 1
//                         "crd": 1737555158285,
//                         "name": "max",
//                         "emojicon": "🖼️",
//                         "path": "_nofilter/27 January '25 ~ 2.md"
//                     }
//                     // highlight
//                 ]
//             },
//             // highlight
//             {
//                 // 2
//                 "crd": 1737555154000,
//                 "name": "item3",
//                 "emojicon": "🫠",
//                 "path": "_nofilter/22 January '25.md"
//             },
//             // highlight
//             {
//                 // 3
//                 "crd": 1737555154001,
//                 "name": "item2",
//                 "emojicon": "🖼️",
//                 "path": "_nofilter/27 January '25 ~ 2.md"
//             }
//             // highlight
//         ]

//         const root = document.getElementById("root")!

//         m.render(root, m(Root))

//         const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555153124"]`)! as HTMLElement
//         const event = new DragEvent("dragstart", {bubbles: true})
//         item.dispatchEvent(event)
//         m.render(root, m(Root))

//         const highlight = root.querySelector(`.highlight-space[data-crd="1737555158200"]`)! as HTMLElement

//         expect(highlight.dataset.index).toBe("1")

//         const highlights = root.querySelectorAll<HTMLElement>(`.highlight-space[data-crd="1737555158000"]`)

//         expect(highlights.length).toBe(1)
//     })

//     test("ondrop MUST move a bookmark to different tree", () => {
//         Bookmarks.items = [
//             {
//                 "crd": 1737555158000,
//                 "name": "deadmonger",
//                 "emojicon": "😶‍🌫️",
//                 "children": [
//                     {
//                         "crd": 1737555153004,
//                         "name": "Мысли",
//                         "emojicon": "🫠",
//                         "path": "_nofilter/22 January '25.md"
//                     },
//                     {
//                         "crd": 1737555158200,
//                         "name": "lol",
//                         "emojicon": "🫠",
//                         "children": [
//                             {
//                                 "crd": 1737555158250,
//                                 "name": "lol2",
//                                 "emojicon": "🖼️",
//                                 "path": "_nofilter/27 January '25 ~ 2.md"
//                             }
//                         ]
//                     },
//                 ]
//             },
//             {
//                 "crd": 1737555154000,
//                 "name": "item3",
//                 "emojicon": "🫠",
//                 "path": "_nofilter/22 January '25.md"
//             },
//             {
//                 "crd": 1737555154001,
//                 "name": "item2",
//                 "emojicon": "🖼️",
//                 "path": "_nofilter/27 January '25 ~ 2.md"
//             }
//         ]

//         const root = document.getElementById("root")!

//         m.render(root, m(ListBookmarks, { inheritedIndex: -1, items: Bookmarks.items, nest: -1 }))

//         const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555154001"]`)! as HTMLElement
//         const dragstart = new DragEvent("dragstart", {bubbles: true})
//         item.dispatchEvent(dragstart)
//         m.render(root, m(Root))

//         const highlight = root.querySelector(`.highlight-space[data-crd="1737555158250"]`)

//         const event = new DragEvent("drop", { bubbles: true })
//         event.dataTransfer?.setData("application/rover.bookmark", "2")

//         highlight?.dispatchEvent(event)

//         expect(Bookmarks.items[0].children![1].children![0].crd).toBe(1737555154001)
//         expect(Bookmarks.items.length).toBe(2)
//     })

//     test("locate drop zone from deep nested tree", () => {
//         Bookmarks.items = [
//             {
//                 "crd": 1737555158000,
//                 "name": "deadmonger",
//                 "emojicon": "😶‍🌫️",
//                 "children": [
//                     {
//                         "crd": 1737555153004,
//                         "name": "Мысли",
//                         "emojicon": "🫠",
//                         "path": "_nofilter/22 January '25.md"
//                     },
//                     {
//                         "crd": 1737555158200,
//                         "name": "lol",
//                         "emojicon": "🫠",
//                         "children": [
//                             {
//                                 "crd": 1737555158250,
//                                 "name": "lol2",
//                                 "emojicon": "🖼️",
//                                 "children": [
//                                     {

//                                         "crd": 1737555154001,
//                                         "name": "item2",
//                                         "emojicon": "🖼️",
//                                         "path": "_nofilter/27 January '25 ~ 2.md"
//                                     }
//                                 ]
//                             }
//                         ]
//                     },
//                 ]
//             },
//         ]

//         const root = document.getElementById("root")!

//         m.render(root, m(ListBookmarks, { inheritedIndex: -1, items: Bookmarks.items, nest: -1 }))

//         const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555154001"]`)! as HTMLElement
//         const dragstart = new DragEvent("dragstart", {bubbles: true})
//         item.dispatchEvent(dragstart)
//         m.render(root, m(Root))

//         expect(Bookmarks.dragged).toStrictEqual([0, 0, 1, 0])
//     })
// })
