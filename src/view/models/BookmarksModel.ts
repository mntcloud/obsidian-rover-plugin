import { ModifyItemModal } from "modals/bookmarks/ModifyItem"
import { RoverBookmark } from "./data/Base"
import { Obsidian } from "./data/Obsidian"

import m from "mithril"

import * as utils from "utils"
import { CreateFolderModal } from "modals/bookmarks/CreateFolder"

interface BookmarksModel {
    items: RoverBookmark[],
    isTesting: boolean,
    isFileDragStarted: boolean,

    dropZone: number[],

    dragged: number[],
    draggedFlat?: number,


    openCreateFolderModal: () => void
    createFolder: (name: string, emojicon: string) => void

    openModifyItemModal: (name: string, emojicon: string, path: string) => void
    modifyItem: (name: string, emojicon: string, path: string) => void

    saveBookmarks: () => void
    
    follow: (position: number[]) => RoverBookmark[]
    followAndPush: (position: number[], element: RoverBookmark) => void
    followAndRemove: (position: number[]) => RoverBookmark
    updatePositions: (example: number[], target: number[]) => void
    locateDropZone: (target: HTMLElement, index: number) => void,
}

export const Bookmarks: BookmarksModel = {
    items: [],
    isTesting: false,
    isFileDragStarted: false,

    dropZone: [],

    dragged: [],

    openCreateFolderModal() {
        if (!Obsidian) {
            console.error("ROVER: no instance of obsidian");
            return;
        }

        new CreateFolderModal(Obsidian.app, (name, emoji) => {
            Bookmarks.createFolder(name, emoji)

            Bookmarks.saveBookmarks()
            Bookmarks.dragged = []
            Bookmarks.draggedFlat = undefined

            m.redraw()
        }).open();
    },

    createFolder(name, emojicon) {
        const currentTree = Bookmarks.follow(Bookmarks.dropZone)
        const currentBookmark = Object.assign({}, currentTree[Bookmarks.dropZone[0]]) // clone

        const draggedBookmark = Bookmarks.followAndRemove(Bookmarks.dragged)
        Bookmarks.updatePositions(Bookmarks.dragged, Bookmarks.dropZone)

        currentTree[Bookmarks.dropZone[0]] = {
            name: name,
            emojicon: emojicon,
            crd: Date.now(),
            path: undefined,

            children: [currentBookmark, draggedBookmark]
        }
    },

    openModifyItemModal(name, emojicon, path) {
        if (!Obsidian) {
            return
        }

        new ModifyItemModal(Obsidian.app, name, emojicon, path, (newName, newEmoji, newPath) => {
            Bookmarks.modifyItem(newName, newEmoji, newPath)
            Bookmarks.saveBookmarks()
        }).open();
    },

    modifyItem(name, emojicon, path) {
        const item = Bookmarks.follow(Bookmarks.dropZone)[Bookmarks.dropZone[0]]

        item.name = name
        item.emojicon = emojicon
        item.path = path
    },

    saveBookmarks() {
        if (!Obsidian) {
            utils.error("obsidian: uninitialized")
            return
        }

        Obsidian.settings.bookmarks = Bookmarks.items
        Obsidian.save()
    },

    locateDropZone(target: HTMLElement, index: number) {
        Bookmarks.dropZone = []
        Bookmarks.dropZone.push(index)

        const event = new Event("locateDropZone", { bubbles: true })
        target.dispatchEvent(event)
    },

    updatePositions(example, target) {
        if (example.length > target.length) {
            return; // changes did nothing to target positions
        }

        let i = example.length - 1, j = target.length - 1;

        while (i >= 0) {
            if (i == 0) {
                if (example[i] < target[j]) {
                    target[j]--
                }
            }

            if (example[i] != target[j]) {
                break
            }

            i--; j--
        }
    },

    // TODO: check for children field and if it doesn't exist, print an error in console
    follow(position: number[]) {
        let current = Bookmarks.items
        let positionIndex = position.length - 1

        while (positionIndex != 0) {
            current = current[position[positionIndex]].children!

            positionIndex--
        }

        return current;
    },

    followAndPush(position: number[], element: RoverBookmark) {
        const current = Bookmarks.follow(position)

        current.splice(position[0], 0, element)
    },

    followAndRemove(position: number[]) {
        const current = Bookmarks.follow(position)

        const target = current[position[0]];

        // well node doesn't have remove function
        current.splice(position[0], 1);

        return target
    }
}