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

  // We need to keep somehow a global state
  // for whole Bookmarks components to show free space when item is dragged.
  dragged:
    | {
        pos: number[];
      }
    | undefined = undefined;

  constructor(private obsidian: ObsidianAppModel | undefined) {}

  listenToVault() {
    this.evrefs = [
      this.obsidian!.vault.on("rename", (file, old) => {
        const item = this.findByPath(old);

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
            firstItem: {
              position: number[];
              item: RoverBookmark;
            };
            secondItem: {
              position: number[];
              item: RoverBookmark;
            };
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

  createFolder(
    name: string,
    emojicon: string,
    dragged: {
      position: number[];
      item: RoverBookmark;
    },
    drop: {
      position: number[];
      item: RoverBookmark;
    },
    timestamp = Date.now(),
  ) {
    const currentTree = this.follow(drop.position);
    const oldLength = currentTree.length;

    this.delete(dragged.position);

    const folder = {
      name: name,
      emojicon: emojicon,
      crd: timestamp,
      path: undefined,
      children: [drop.item, dragged.item],
    };

    const dropIndex = drop.position.length - 1;

    if (
      oldLength > currentTree.length &&
      currentTree[drop.position[dropIndex] - 1]?.crd == drop.item.crd
    ) {
      currentTree[drop.position[dropIndex] - 1] = folder;
    } else {
      currentTree[drop.position[dropIndex]] = folder;
    }
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

  move(target: number[], item: RoverBookmark) {
    const seq = this.follow(target);
    const oldLength = seq.length;

    this.delete(this.dragged!.pos);

    // check if op above modifies the sequence
    if (oldLength > seq.length) {
      const destination = target[target.length - 1];

      if (this.dragged!.pos[this.dragged!.pos.length - 1] > destination) {
        seq.splice(destination, 0, item);
      } else {
        seq.splice(destination - 1, 0, item);
      }
    } else {
      seq.splice(target[target.length - 1], 0, item);
    }
  }

  delete(position: number[]) {
    const current = this.follow(position);

    const target = current[position[position.length - 1]];

    // well, nodejs (our testing env) doesn't have a remove function
    current.splice(position[position.length - 1], 1);

    return target;
  }

  save() {
    if (!this.obsidian) {
      logError("obsidian: uninitialized");
      return;
    }

    this.obsidian.settings.bookmarks = this.items;
    this.obsidian.save();
  }

  /**
   * What follow returns on position, for example, [0, 0, 0], illustrated
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

    while (positionIndex != position.length - 1) {
      current = current[position[positionIndex]].children!;

      positionIndex++;
    }

    return current;
  }

  findByPath(
    path: string,
    items: RoverBookmark[] = this.items,
  ): RoverBookmark | null {
    for (const item of items) {
      if (item.children) {
        const res = this.findByPath(path, item.children);

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
}
