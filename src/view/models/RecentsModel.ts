import { EventRef, TFile } from "obsidian";
import type { RoverRecentsStore } from "rover/core";

import m from "mithril";
import { extname } from "node:path";
import { RoverView } from "../RoverSidebarView";
import { log } from "rover/helpers";

export class RecentsBaseModel {
  pendingNewFolderPath?: string;
  oldFolderPath?: string;

  active?: RoverRecentsStore;

  constructor(
    private rover: RoverView | undefined,
    public previous: RoverRecentsStore[] = [],
  ) {}

  attachListeners() {
    // TODO: rework methods to combine with FileSystem handlers
    //       it should help to control m.redraw() more reliable
    this.rover!.subscribe("vault:delete", (file) => {
      this.previous = this.previous.filter((path) => path.full != file.path);

      this.save();
    });
    this.rover!.subscribe("vault:rename", async (file, oldPath) => {
      if (file.path == this.rover!.app.workspace.getActiveFile()?.path) {
        this.active = this.createRecentsItem(
          this.rover!.app.workspace.getActiveFile()!,
        );
      } else {
        const index = this.previous.findIndex((path) => path.full == oldPath);

        if (index != -1) {
          this.previous[index] = {
            parentPath: file.parent?.isRoot() ? "" : file.parent!.path,
            name: file.name.replace(extname(file.name), ""),
            full: file.path,
          };

          this.save();
        }
      }
    });
    this.rover!.subscribe("workspace:file-open", () => {
      this.update();
    });
  }

  update(triggerRedraw: boolean = false): void {
    if (!this.rover) {
      console.error("ROVER: app instance is unintialized");
      return;
    }

    if (this.active) {
      this.previous = [this.active, ...this.previous.slice(0, 5)];
    }

    const activeFile = this.rover.app.workspace.getActiveFile();

    if (activeFile) {
      this.active = this.createRecentsItem(activeFile);

      this.previous = this.previous.filter(
        (path) => path.full != this.active!.full,
      );
    }

    this.save();

    if (triggerRedraw) {
      m.redraw();
    }
  }

  createRecentsItem(file: TFile) {
    return {
      parentPath: file.parent?.isRoot() ? "" : file.parent!.path,
      name: file.basename,
      full: file.path,
    };
  }

  save() {
    if (!this.rover) {
      console.error("ROVER: Obsidian API is not available");
      return;
    }

    this.rover.settings.recents = this.previous;
    this.rover.save(this.rover.settings);
  }
}
