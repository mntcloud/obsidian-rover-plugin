/**
 * @jest-environment jsdom
 */

import m from "mithril"
import { Bookmarks } from "view/models/BookmarksModel";

import { ExplorerModel } from "view/models/ExplorerModel";
import { Root } from "../misc/root.component";

jest.mock("view/models/BookmarksModel", () => {
    const original = jest.requireActual("view/models/BookmarksModel")

    return {
        __esModule: true,
        Bookmarks: Object.assign(original.Bookmarks, { openCreateFolderModal: jest.fn(), openModifyItemModal: jest.fn() })
    }
})
const bookmarksMocked = jest.mocked(Bookmarks)

jest.mock("view/models/FileManagerModel")
const fileManagerMocked = jest.mocked(ExplorerModel)

describe("BookmarksItem", () => {
    beforeAll(() => {
        document.body.innerHTML =
            `<div id="root">
       </div>`
    })


    test("click MUST open the file", () => {
        Bookmarks.items = [
            {
                "crd": 1737554144200,
                "name": "lom",
                "emojicon": "👽",
                "path": "_nofilter/22 January '25.md"
            },
        ]

        const root = document.getElementById("root")!

        m.render(root, m(Root))

        const item = root.querySelector(`.rover-bookmark-item`)!
        const event = new Event("click", { bubbles: true })

        item.dispatchEvent(event)

        expect(fileManagerMocked.openFile.mock.calls).toHaveLength(1)
    })

    test("On drag start MUST populate dragged and drag end MUST clean dragged", () => {
        Bookmarks.isTesting = true
        Bookmarks.dragged = []
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
        ]

        const root = document.getElementById("root")!

        m.render(root, m(Root))

        const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555158250"]`)!

        const start = new DragEvent("dragstart", { bubbles: true })
        item.dispatchEvent(start)

        expect(start.dataTransfer?.types.includes("application/rover.bookmark")).toBeTruthy()
        expect(Bookmarks.dragged).toEqual([0, 1, 0])

        const end = new DragEvent("dragend", { bubbles: true })
        item.dispatchEvent(end)

        expect(Bookmarks.dragged).toEqual([])
    })

    test("if another bookmark is dropped, item MUST create a folder at the same position", () => {
        Bookmarks.isTesting = true
        Bookmarks.dragged = []
        bookmarksMocked.openCreateFolderModal.mockImplementation(() => {
            Bookmarks.createFolder("wizard", "🧙")
        })
        Bookmarks.items = [ 
            {
                "crd": 1737555153004,
                "name": "Мысли",
                "emojicon": "🫠",
                "path": "_nofilter/22 January '25.md"
            },
            {
                "crd": 1737555158250,
                "name": "lol2",
                "emojicon": "🖼️",
                "path": "_nofilter/27 January '25 ~ 2.md"
            }
        ]

        const root = document.getElementById("root")!

        m.render(root, m(Root))

        const draggedItem = root.querySelector(`.rover-bookmark-item[data-crd="1737555158250"]`)!

        const start = new DragEvent("dragstart", { dataTransfer: new DataTransfer(), bubbles: true })
        draggedItem.dispatchEvent(start)
        m.render(root, m(Root))

        expect(start.dataTransfer?.types.includes("application/rover.bookmark")).toBeTruthy()
        expect(Bookmarks.dragged).toEqual([1])

        const targetItem = root.querySelector(`.rover-bookmark-item[data-crd="1737555153004"]`)!

        const drop = new DragEvent("drop", { bubbles: true })
        drop.dataTransfer?.setData("application/rover.bookmark", "1")

        targetItem.dispatchEvent(drop)

        expect(bookmarksMocked.openCreateFolderModal.mock.calls).toHaveLength(1) 
        expect(Bookmarks.dragged).toEqual([])

        expect(Bookmarks.items[0].children).toBeTruthy()
        expect(Bookmarks.items[0].name).toEqual("wizard")
        expect(Bookmarks.items[0].children![0].name).toEqual("Мысли")
    })

    test("if file is dropped, item MUST replace it's own path with file's", () => {
        Bookmarks.isTesting = true
        Bookmarks.dragged = []
        bookmarksMocked.openModifyItemModal.mockImplementation((name, emojicon, path) => {
            Bookmarks.modifyItem(name, emojicon, path)
        })
        Bookmarks.items = [ 
            {
                "crd": 1737555153004,
                "name": "Мысли",
                "emojicon": "🫠",
                "path": "_nofilter/22 January '25.md"
            },
        ]

        const root = document.getElementById("root")!

        m.render(root, m(Root))

        const item = root.querySelector(`.rover-bookmark-item[data-crd="1737555153004"]`)!

        const drop = new DragEvent("drop", { bubbles: true })
        drop.dataTransfer?.setData("application/rover.file", "somewhere/here.md")

        item.dispatchEvent(drop)

        expect(bookmarksMocked.openModifyItemModal.mock.calls).toHaveLength(1) 
        expect(Bookmarks.dragged).toEqual([])

        expect(Bookmarks.items[0].path).toEqual("somewhere/here.md")
    })
})