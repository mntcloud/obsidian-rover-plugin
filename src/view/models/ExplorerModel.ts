import m from "mithril";

import { basename, dirname } from "node:path";
import { RoverFile } from "../../core";
import type { ObsidianAppModel } from "../../core";
import { RecentsBaseModel } from "./RecentsModel";
import { EventRef } from "obsidian";
import { log } from "rover/utils";

export class ExplorerBaseModel {
  isBeingTested = false;
  updateWaitlist: Record<string, boolean> = {};
  evrefs: EventRef[] = [];

  constructor(
    private obsidian: ObsidianAppModel | undefined,
    private recentsModel: RecentsBaseModel,
  ) {}

  listenToVault(
    onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
  ) {
    this.evrefs = [
      this.obsidian!.vault.on("create", (file) =>
        this.onCreateDelete(file.path, onDOMUpdate),
      ),
      this.obsidian!.vault.on("rename", (file, oldPath) =>
        this.onRename(file.path, oldPath, onDOMUpdate),
      ),
      this.obsidian!.vault.on("delete", (file) =>
        this.onCreateDelete(file.path, onDOMUpdate),
      ),
    ];
  }

  async onCreateDelete(
    file: string,
    onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
  ) {
    if (this.countSegments(file)) {
      const dirpath = dirname(file);

      await onDOMUpdate(false, dirpath);
    } else {
      await onDOMUpdate(true);
    }

    if (!this.isBeingTested) {
      m.redraw();
    }
  }

  async onRename(
    curPath: string,
    oldPath: string,
    onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
  ) {
    const cur = curPath.split("/");
    const old = oldPath.split("/");

    // NOTE:
    // Rename handler can be invoked, when folder is renamed or moved
    // and Vault API will pass some uncessary same looking old and new paths,
    // except they have this folder as an ancestor.
    //
    // EXAMPLE:
    // NEW: dev/hacking/rover/file.md
    // OLD: dev/rnd/rover/file.md
    if (cur[cur.length - 1] != old[old.length - 1]) {
      const newPath = cur.slice(0, cur.length - 1).join("/");
      const oldPath = old.slice(0, old.length - 1).join("/");

      if (newPath == oldPath) {
        if (cur.length == 1) {
          await onDOMUpdate(true);
        } else {
          await onDOMUpdate(false, newPath);
        }
      } else {
        await onDOMUpdate(
          newPath ? false : true,
          newPath ? newPath : undefined,
        );
        await onDOMUpdate(
          oldPath ? false : true,
          oldPath ? oldPath : undefined,
        );
      }

      if (!this.isBeingTested) {
        m.redraw();
      }
    } else {
      const path = old.slice(0, old.length - 1).join("/");

      if (await this.obsidian?.vault.adapter.stat(path)) {
        await onDOMUpdate(path ? false : true, path ? path : undefined);

        const newPath = cur.slice(0, cur.length - 1).join("/");

        await onDOMUpdate(
          newPath ? false : true,
          newPath ? newPath : undefined,
        );

        if (!this.isBeingTested) {
          m.redraw();
        }
      }
    }
  }

  unlistenToVault() {
    for (const evref of this.evrefs) {
      this.obsidian!.vault.offref(evref);
    }
  }

  countSegments(path: string) {
    let count = 0;

    for (const char of path) {
      if (char == "/") {
        count++;
      }
    }

    return count;
  }

  comparator(a: RoverFile, b: RoverFile) {
    if (a.isFolder && !b.isFolder) {
      return -1;
    } else if (!a.isFolder && b.isFolder) {
      return 1;
    } else {
      return a.name
        .toLocaleLowerCase()
        .localeCompare(b.name.toLocaleLowerCase());
    }
  }

  async openFile(path: string, openNewTab = false) {
    if (!this.obsidian) {
      console.error("ROVER: workspace is not initialized");
      return;
    }

    const leaf = this.obsidian.workspace.getLeaf(openNewTab);
    const file = this.obsidian.vault.getFileByPath(path);

    if (file) {
      await leaf.openFile(file);

      this.recentsModel.update();
    }
  }

  async moveFile(path: string, destination: string) {
    const file = this.obsidian!.vault.getFileByPath(path)!;

    if (file.parent && file.parent.path != destination) {
      await this.obsidian!.app.fileManager.renameFile(
        file,
        `${destination}/${file.name}`,
      );
    } else {
      log("SAME!");
    }
  }

  async moveFolder(path: string, destination: string) {
    const file = this.obsidian!.vault.getFolderByPath(path)!;

    if (file.parent && file.parent.path != destination) {
      await this.obsidian!.app.fileManager.renameFile(
        file,
        `${destination}/${file.name}`,
      );
    } else {
      log("SAME!");
    }
  }

  async renameFolder(path: string, newName: string) {
    const file = this.obsidian!.vault.getFolderByPath(path)!;

    if (file.parent && !file.parent.isRoot()) {
      await this.obsidian!.app.fileManager.renameFile(
        file,
        `${file.parent.path}/${newName}`,
      );
    } else {
      await this.obsidian!.app.fileManager.renameFile(file, `${newName}`);
    }
  }

  async getFiles(path: string) {
    const files: RoverFile[] = [];

    for (const item of this.obsidian!.vault.getFolderByPath(path)!.children) {
      const stat = await this.obsidian!.vault.adapter.stat(item.path);

      if (!stat) {
        console.warn(`ROVER: Unable to get stat for ${item.path}`);
        continue;
      }

      files.push({
        mtime: stat!.type != "file" ? stat!.ctime : stat!.mtime,
        name: stat!.type != "folder" ? basename(item.name, ".md") : item.name,
        path: item.path,
        isFolder: stat!.type == "folder",
      });
    }

    files.sort(this.comparator);

    return files;
  }
}
