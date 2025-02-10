/**
 * @jest-environment jsdom
 */

import m from "mithril"
import { Bookmarks } from "view/models/BookmarksModel";
import { ListBookmarks } from "view/components/Bookmarks/ListBookmarks";
import { Root } from "../misc/root.component";

describe("HighlightSpace", () => {
    beforeAll(() => {
        document.body.innerHTML =
            `<div id="root">
       </div>`
    })

    test("highlights free space when element is dragged", () => {
        Bookmarks.isTesting = true
        Bookmarks.items = [
            // highlight 
            {
                // 0
                "crd": 1737555158000,
                "name": "deadmonger",
                "emojicon": "😶‍🌫️",
                "children": [
                    // highlight 
                    {
                        // 0
                        "crd": 1737555153004,
                        "name": "Мысли",
                        "emojicon": "🫠",
                        "path": "_nofilter/22 January '25.md"
                    },
                    // highlight 
                    {
                        // 1
                        "crd": 1737555158200,
                        "name": "lol",
                        "emojicon": "🫠",
                        "children": [
                            // highlight 
                            {
                                // 0
                                "crd": 1737555158250,
                                "name": "lol2",
                                "emojicon": "🖼️",
                                "path": "_nofilter/27 January '25 ~ 2.md"
                            }
                        ]
                    },
                ]
            },
            // highlight 
            {
                // 1
                "crd": 1737555152222,
                "name": "folder2",
                "emojicon": "👽",
                "children": [
                    // no highlight 0
                    {
                        // 0
                        "crd": 1737555153124,
                        "name": "hey",
                        "emojicon": "🫠",
                        "path": "_nofilter/22 January '25.md"
                    },
                    // no highlight
                    {
                        // 1
                        "crd": 1737555158285,
                        "name": "max",
                        "emojicon": "🖼️",
                        "path": "_nofilter/27 January '25 ~ 2.md"
                    }
                    // highlight 
                ]
            },
            // highlight
            {
                // 2
                "crd": 1737555154000,
                "name": "item3",
                "emojicon": "🫠",
                "path": "_nofilter/22 January '25.md"
            },
            // highlight
            {
                // 3
                "crd": 1737555154001,
                "name": "item2",
                "emojicon": "🖼️",
                "path": "_nofilter/27 January '25 ~ 2.md"
            }
            // highlight
        ]

        const root = document.getElementById("root")!

        m.render(root, m(Root))
        
        const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555153124"]`)! as HTMLElement
        const event = new DragEvent("dragstart", {bubbles: true})
        item.dispatchEvent(event)
        m.render(root, m(Root))


        const highlight = root.querySelector(`.highlight-space[data-crd="1737555158200"]`)! as HTMLElement

        expect(highlight.dataset.index).toBe("1")

        const highlights = root.querySelectorAll<HTMLElement>(`.highlight-space[data-crd="1737555158000"]`)

        expect(highlights.length).toBe(1)
    })

    test("ondrop MUST move a bookmark to different tree", () => {
        Bookmarks.items = [
            {
                "crd": 1737555158000,
                "name": "deadmonger",
                "emojicon": "😶‍🌫️",
                "children": [
                    {
                        "crd": 1737555153004,
                        "name": "Мысли",
                        "emojicon": "🫠",
                        "path": "_nofilter/22 January '25.md"
                    },
                    {
                        "crd": 1737555158200,
                        "name": "lol",
                        "emojicon": "🫠",
                        "children": [
                            {
                                "crd": 1737555158250,
                                "name": "lol2",
                                "emojicon": "🖼️",
                                "path": "_nofilter/27 January '25 ~ 2.md"
                            }
                        ]
                    },
                ]
            },
            {
                "crd": 1737555154000,
                "name": "item3",
                "emojicon": "🫠",
                "path": "_nofilter/22 January '25.md"
            },
            {
                "crd": 1737555154001,
                "name": "item2",
                "emojicon": "🖼️",
                "path": "_nofilter/27 January '25 ~ 2.md"
            }
        ]

        const root = document.getElementById("root")!

        m.render(root, m(ListBookmarks, { inheritedIndex: -1, items: Bookmarks.items, nest: -1 }))


        const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555154001"]`)! as HTMLElement
        const dragstart = new DragEvent("dragstart", {bubbles: true})
        item.dispatchEvent(dragstart)
        m.render(root, m(Root))

        const highlight = root.querySelector(`.highlight-space[data-crd="1737555158250"]`)

        const event = new DragEvent("drop", { bubbles: true })
        event.dataTransfer?.setData("application/rover.bookmark", "2")

        highlight?.dispatchEvent(event)

        expect(Bookmarks.items[0].children![1].children![0].crd).toBe(1737555154001)
        expect(Bookmarks.items.length).toBe(2)
    })

    test("locate drop zone from deep nested tree", () => {
        Bookmarks.items = [
            {
                "crd": 1737555158000,
                "name": "deadmonger",
                "emojicon": "😶‍🌫️",
                "children": [
                    {
                        "crd": 1737555153004,
                        "name": "Мысли",
                        "emojicon": "🫠",
                        "path": "_nofilter/22 January '25.md"
                    },
                    {
                        "crd": 1737555158200,
                        "name": "lol",
                        "emojicon": "🫠",
                        "children": [
                            {
                                "crd": 1737555158250,
                                "name": "lol2",
                                "emojicon": "🖼️",
                                "children": [
                                    {

                                        "crd": 1737555154001,
                                        "name": "item2",
                                        "emojicon": "🖼️",
                                        "path": "_nofilter/27 January '25 ~ 2.md"
                                    }
                                ]
                            }
                        ]
                    },
                ]
            },
        ]

        const root = document.getElementById("root")!

        m.render(root, m(ListBookmarks, { inheritedIndex: -1, items: Bookmarks.items, nest: -1 }))

        const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555154001"]`)! as HTMLElement
        const dragstart = new DragEvent("dragstart", {bubbles: true})
        item.dispatchEvent(dragstart)
        m.render(root, m(Root))

         
    })
})