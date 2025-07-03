import { ModifyItemModal } from "modals/bookmarks/ModifyItem";
import { RoverBookmark } from "./data/Base";
import { Obsidian } from "./data/Obsidian";

import m from "mithril";

import * as utils from "utils";
import { CreateFolderModal } from "modals/bookmarks/CreateFolder";
import { CreateItemModal } from "modals/bookmarks/CreateItem";
import { EventRef } from "obsidian";

class BookmarksModel {
    evrefs: EventRef[]    

    items: RoverBookmark[] = [];
    isTesting = false;
    isFileDragStarted = false;

    dragged: {
        pos: number[];
    } | undefined = undefined;

    listenToVault() {
        this.evrefs = [
            Obsidian!.vault.on("rename", (file, old) => {
                const item = this.find(old) 

                if (item) {
                    item.path = file.path

                    this.save()
                }
            })
        ]
    }

    unlistenToVault() {
        for (const evref of this.evrefs) {
            Obsidian!.vault.offref(evref);
        }
    }


    openCreateItem(pos: number[], path: string) {
        new CreateItemModal(
            Obsidian!.app,
            path,
            (name, emoji, path) => {
                const seq = this.follow(pos)

                seq.splice(pos[pos.length - 1], 0, {
                    crd: Date.now(),
                    name: name,
                    emojicon: emoji,
                    path: path,
                });

                this.save();

                m.redraw();
            },
        ).open();
    }

    openCreateFolderModal(pos: number[]) {
        if (!Obsidian) {
            console.error("ROVER: no instance of obsidian");
            return;
        }

        new CreateFolderModal(Obsidian.app, (name, emoji) => {
            this.createFolder(name, emoji, pos);

            this.save();
            this.dragged = undefined;

            m.redraw();
        }).open();
    }

    // TODO: rewrite this using new techniques from move function
    createFolder(name: string, emojicon: string, zone: number[]) {
        const currentTree = this.follow(zone);
        const currentBookmark = Object.assign({}, currentTree[zone[0]]); // clone

        const draggedBookmark = this.delete(this.dragged!.pos);
        this.updatePositions(this.dragged!.pos, zone);

        currentTree[zone[0]] = {
            name: name,
            emojicon: emojicon,
            crd: Date.now(),
            path: undefined,

            children: [currentBookmark, draggedBookmark],
        };
    }

    openModifyItemModal(
        name: string,
        emojicon: string,
        pos: number[],
        path?: string,
    ) {
        if (!Obsidian) {
            return;
        }

        new ModifyItemModal(
            Obsidian.app,
            name,
            emojicon,
            (newName, newEmoji, path) => {
                this.update(newName, newEmoji, pos, path);
                this.save();
                m.redraw();
            },
            path,
        ).open();
    }

    update(name: string, emojicon: string, pos: number[], path?: string) {
        const item = this.follow(pos)[pos[0]];

        item.name = name;
        item.emojicon = emojicon;

        if (path) {
            item.path = path;
        }
    }

    save() {
        if (!Obsidian) {
            utils.error("obsidian: uninitialized");
            return;
        }

        Obsidian.settings.bookmarks = this.items;
        Obsidian.save();
    }

    updatePositions(example: number[], target: number[]) {
        if (example.length > target.length) {
            return; // changes did nothing to target positions
        }

        let i = example.length - 1, j = target.length - 1;

        while (i >= 0) {
            if (i == 0) {
                if (example[i] < target[j]) {
                    target[j]--;
                }
            }

            if (example[i] != target[j]) {
                break;
            }

            i--;
            j--;
        }
    }

    // TODO: check for children field and if it doesn't exist, print an error in console
    follow(position: number[]) {
        let current = this.items;
        let positionIndex = 0;

        // NOTE: code was written to go from the end of the array
        while (positionIndex != position.length - 1) {
            current = current[position[positionIndex]].children!;

            positionIndex++;
        }

        return current;
    }

    find(path: string, items: RoverBookmark[] = this.items): RoverBookmark | null {
        for (const item of items) {
            if (item.children) {
                const res = this.find(path, item.children)

                if (res) {
                    return res
                }
            } else {
                if (item.path == path) {
                    return item
                }
            }
        }

        return null
    }

    move(to: number[], item: RoverBookmark) {
        const seq = this.follow(to);
        const oldLength = seq.length;

        this.delete(this.dragged!.pos);

        // check if op above modifies the sequence
        if (oldLength > seq.length) {
            const destination = to[to.length - 1];

            if (
                this.dragged!.pos[this.dragged!.pos.length - 1] >
                    destination
            ) {
                seq.splice(destination, 0, item);
            } else {
                seq.splice(destination - 1, 0, item);
            }
        } else {
            seq.splice(to[to.length - 1], 0, item);
        }
    }

    delete(position: number[]) {
        const current = this.follow(position);

        const target = current[position[position.length - 1]];

        // well, nodejs (our testing env) doesn't have remove function
        current.splice(position[position.length - 1], 1);

        return target;
    }
}

export const Bookmarks = new BookmarksModel();
