import m from "mithril";

import { basename, dirname } from "node:path";
import { RoverFile } from "../../core";
import { log } from "rover/helpers";
import { RoverView } from "../RoverSidebarView";
import { TAbstractFile, TFile, TFolder } from "obsidian";

export class ExplorerBaseModel {
  isBeingTested = false;
  updateWaitlist: Record<string, boolean> = {};

  constructor(public rover: RoverView | undefined) {}

  listenToVault(
    onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
  ) {
    this.rover!.subscribe("vault:create", (file) =>
      this.onCreateDelete(file.path, onDOMUpdate),
    );
    this.rover!.subscribe("vault:rename", (file, oldPath) =>
      this.onRename(file.path, oldPath, onDOMUpdate),
    );
    this.rover!.subscribe("vault:delete", (file) =>
      this.onCreateDelete(file.path, onDOMUpdate),
    );
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

      if (await this.rover?.app.vault.adapter.stat(path)) {
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
    if (!this.rover) {
      console.error("ROVER: workspace is not initialized");
      return;
    }

    const leaf = this.rover.app.workspace.getLeaf(openNewTab);
    const file = this.rover.app.vault.getFileByPath(path);

    if (file) {
      await leaf.openFile(file);
    }
  }

  /**
   *
   * @param from
   * @param destination where to move the file, if destination is skipped, it will be moved to the root
   */
  async move(from: string, destination?: string) {
    const file = this.rover!.app.vault.getAbstractFileByPath(from)!;

    if (file.parent && file.parent.path != destination) {
      if (destination) {
        await this.rover!.app.fileManager.renameFile(
          file,
          `${destination}/${file.name}`,
        );
      } else {
        await this.rover!.app.fileManager.renameFile(file, file.name);
      }
    } else {
      log("SAME!");
    }
  }

  async renameFolder(path: string, newName: string) {
    const file = this.rover!.app.vault.getFolderByPath(path)!;

    if (file.parent && !file.parent.isRoot()) {
      await this.rover!.app.fileManager.renameFile(
        file,
        `${file.parent.path}/${newName}`,
      );
    } else {
      await this.rover!.app.fileManager.renameFile(file, `${newName}`);
    }
  }

  async renameFile(path: string, newName: string) {
    const file = this.retrieve("file", path)!;

    if (file.parent) {
      await this.rover!.app.fileManager.renameFile(
        file,
        `${file.parent.path}/${newName}.${file.extension}`,
      );
    } else {
      await this.rover!.app.fileManager.renameFile(
        file,
        `${newName}.${file.extension}`,
      );
    }
  }

  async copyFile(file: TFile) {
    if (file.parent) {
      await this.rover!.app.vault.copy(
        file,
        `${file.parent.path}/${file.basename} new.${file.extension}`,
      );
    } else {
      await this.rover!.app.vault.copy(
        file,
        `${file.basename} new.${file.extension}`,
      );
    }
  }

  /**
   *
   * @param from folder path, if it is skipped, files will be retrived from the root
   * @returns
   */
  async getFiles(from?: string) {
    const files: RoverFile[] = [];
    const folder = from
      ? this.rover!.app.vault.getFolderByPath(from)!.children
      : this.rover!.app.vault.getRoot().children;

    for (const item of folder) {
      const stat = await this.rover!.app.vault.adapter.stat(item.path);

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

  retrieve(type: "folder", path: string): TFolder | null;
  retrieve(type: "file", path: string): TFile | null;
  retrieve(type: "file" | "folder", path: string): TFile | TFolder | null {
    switch (type) {
      case "file":
        return this.rover!.app.vault.getFileByPath(path);
      case "folder":
        return this.rover!.app.vault.getFolderByPath(path);
    }
  }

  async createDirectory(name: string, location?: string) {
    if (location) {
      return this.rover!.app.vault.adapter.mkdir(`${location}/${name}`);
    } else {
      return this.rover!.app.vault.adapter.mkdir(`${name}`);
    }
  }

  async delete(file: TAbstractFile) {
    return this.rover!.app.vault.trash(file, false);
  }
}
