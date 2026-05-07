import { ModifyItemModal } from "rover/modals/bookmarks/ModifyItem";
import { RoverBookmark } from "../../core";
import type { ObsidianAppModel } from "../../core";

import m from "mithril";

import { logError, log } from "rover/utils";
import { CreateFolderModal } from "rover/modals/bookmarks/CreateFolder";
import { CreateItemModal } from "rover/modals/bookmarks/CreateItem";
import { EventRef } from "obsidian";

export class BookmarksBaseModel {
  evrefs: EventRef[] = [];

  items: RoverBookmark[] = [];
  isTesting = false;
  isFileDragStarted = false;

  dragged:
    | {
        pos: number[];
      }
    | undefined = undefined;

  constructor(private obsidian: ObsidianAppModel | undefined) {}

  listenToVault() {
    this.evrefs = [
      this.obsidian!.vault.on("rename", (file, old) => {
        const item = this.find(old);

        if (item) {
          item.path = file.path;

          this.save();
        }
      }),
    ];
  }

  unlistenToVault() {
    for (const evref of this.evrefs) {
      this.obsidian!.vault.offref(evref);
    }
  }

  // We need to combine somehow key and value from Modals,
  // other ways just doesn't narrow to one object-value assigned to one key
  openModal(
    ...[name, params]:
      | [
          "createItem",
          {
            pos: number[];
            path: string;
          },
        ]
      | [
          "createFolder",
          {
            firstItem: number[];
            secondItem: number[];
          },
        ]
      | [
          "modifyItem",
          {
            pos: number[];
            name: string;
            emoji: string;
            path?: string;
          },
        ]
  ) {
    if (!this.obsidian) {
      logError("ROVER: no instance of obsidian");
      return;
    }

    switch (name) {
      case "modifyItem": {
        return new ModifyItemModal(
          this.obsidian!.app,
          params!.name,
          params.emoji,
          (newName, newEmoji, path) => {
            this.update(newName, newEmoji, params.pos, path);
            this.save();
            m.redraw();
          },
          params.path,
        ).open();
      }
      case "createItem": {
        return new CreateItemModal(
          this.obsidian!.app,
          params.path!,
          (name, emoji, path) => {
            const seq = this.follow(params.pos);

            seq.splice(params.pos[params.pos.length - 1], 0, {
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
      case "createFolder": {
        return new CreateFolderModal(this.obsidian!.app, (name, emoji) => {
          this.createFolder(name, emoji, params.firstItem, params.secondItem);

          this.save();
          this.dragged = undefined;

          m.redraw();
        }).open();
      }
    }
  }

  // TODO: rewrite this using new techniques from move function
  createFolder(
    name: string,
    emojicon: string,
    dragged: number[],
    drop: number[],
  ) {
    const currentTree = this.follow(drop);
    const currentBookmark = Object.assign({}, currentTree[drop[0]]); // clone

    const draggedBookmark = this.delete(dragged);
    this.updatePositions(dragged, drop);

    currentTree[drop[0]] = {
      name: name,
      emojicon: emojicon,
      crd: Date.now(),
      path: undefined,

      children: [currentBookmark, draggedBookmark],
    };
  }

  update(name: string, emojicon: string, pos: number[], path?: string) {
    const item = this.follow(pos)[pos[pos.length - 1]];

    log(item, pos, this.follow(pos));

    item.name = name;
    item.emojicon = emojicon;

    if (path) {
      item.path = path;
    }
  }

  save() {
    if (!this.obsidian) {
      logError("obsidian: uninitialized");
      return;
    }

    this.obsidian.settings.bookmarks = this.items;
    this.obsidian.save();
  }

  updatePositions(example: number[], target: number[]) {
    if (example.length > target.length) {
      return; // changes did nothing to target positions
    }

    let i = example.length - 1,
      j = target.length - 1;

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

  /**
   * What follow exactly returns on position, for example, [0, 0, 0], illustrated
   * ```
   * Root
   * └── Bookmark Folder (0)
   *     └── Nested Folder (0) (`follow` returns it's children)
   *          ├── Item1 (0) (but position points to this item)
   *          ├── Item2 (1)
   *          └── Item3 (2)
   * ```
   */
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

  find(
    path: string,
    items: RoverBookmark[] = this.items,
  ): RoverBookmark | null {
    for (const item of items) {
      if (item.children) {
        const res = this.find(path, item.children);

        if (res) {
          return res;
        }
      } else {
        if (item.path == path) {
          return item;
        }
      }
    }

    return null;
  }

  move(position: number[], item: RoverBookmark) {
    const seq = this.follow(position);
    const oldLength = seq.length;

    this.delete(this.dragged!.pos);

    // check if op above modifies the sequence
    if (oldLength > seq.length) {
      const destination = position[position.length - 1];

      if (this.dragged!.pos[this.dragged!.pos.length - 1] > destination) {
        seq.splice(destination, 0, item);
      } else {
        seq.splice(destination - 1, 0, item);
      }
    } else {
      seq.splice(position[position.length - 1], 0, item);
    }
  }

  delete(position: number[]) {
    const current = this.follow(position);

    const target = current[position[position.length - 1]];

    // well, nodejs (our testing env) doesn't have a remove function
    current.splice(position[position.length - 1], 1);

    return target;
  }
}
