import { EventRef, TFile } from "obsidian";
import type { RoverRecentsStore } from "rover/core";

import m from "mithril";
import { RoverView } from "../RoverSidebarView";

export class RecentsBaseModel {
  pendingNewFolderPath?: string;
  oldFolderPath?: string;

  active?: RoverRecentsStore;

  constructor(
    private rover: RoverView | undefined,
    public previous: RoverRecentsStore[] = [],
  ) {}

  init() {
    this.attachListeners();

    const file = this.rover!.app.workspace.getActiveFile();
    this.update(file, true);
  }

  attachListeners() {
    this.rover!.subscribe("vault:delete", (file) => {
      this.previous = this.previous.filter((path) => path.full != file.path);

      this.save();
    });
    this.rover!.subscribe("vault:rename", async (file, oldPath) => {
      if (file instanceof TFile) {
        if (this.active?.full == oldPath) {
          this.active = this.createRecentsItem(file);
        } else {
          const index = this.previous.findIndex((path) => path.full == oldPath);

          if (index != -1) {
            this.previous[index] = {
              parentPath: file.parent?.isRoot() ? "" : file.parent!.path,
              name: file.basename,
              full: file.path,
            };

            this.save();
          }
        }
      }
    });
    this.rover!.subscribe("workspace:file-open", (file) => {
      this.update(file);
    });
  }

  update(
    activeFile: TFile | null = null,
    triggerRedraw: boolean = false,
  ): void {
    if (!this.rover) {
      console.error("ROVER: app instance is unintialized");
      return;
    }

    if (this.active) {
      this.previous = [this.active, ...this.previous.slice(0, 5)];
    }

    this.active = activeFile ? this.createRecentsItem(activeFile) : undefined;

    if (this.active) {
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
