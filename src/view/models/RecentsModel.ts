import { EventRef, TFile } from "obsidian";
import type { RoverRecentsStore } from "rover/core";

import m from "mithril";
import { extname } from "node:path";
import { RoverView } from "../RoverSidebarView";
import { log } from "rover/helpers";

export class RecentsBaseModel {
  pendingNewFolderPath?: string;
  oldFolderPath?: string;

  active: TFile | null = null;

  constructor(
    private rover: RoverView | undefined,
    public previous: RoverRecentsStore[] = [],
  ) {}

  attachListeners() {
    // TODO: rework methods to combine with FileSystem handlers
    //       it should help to control m.redraw() more reliable
    (this.rover!.subscribe("vault:delete", (file) => {
      this.previous = this.previous.filter((path) => path.full != file.path);

      this.save();
      m.redraw();
    }),
      this.rover!.subscribe("vault:rename", async (file, oldPath) => {
        if (file.path == this.rover!.app.workspace.getActiveFile()?.path) {
          this.active = this.rover!.app.workspace.getActiveFile();
          m.redraw();
        } else {
          const index = this.previous.findIndex((path) => path.full == oldPath);

          if (index != -1) {
            this.previous[index] = {
              parentPath: file.parent?.isRoot() ? "" : file.parent!.path,
              name: file.name.replace(extname(file.name), ""),
              full: file.path,
            };

            this.save();
            m.redraw();
          }
        }
      }),
      this.rover!.subscribe("workspace:file-open", () => {
        this.update();
      }));
  }

  update(triggerRedraw: boolean = false): void {
    if (!this.rover) {
      console.error("ROVER: app instance is unintialized");
      return;
    }

    if (this.active) {
      this.previous = [
        {
          parentPath: this.active.parent?.isRoot()
            ? ""
            : this.active.parent!.path,
          name: this.active.basename,
          full: this.active.path,
        },
        ...this.previous.slice(0, 5),
      ];
    }

    this.active = this.rover.app.workspace.getActiveFile();

    if (this.active) {
      this.previous = this.previous.filter(
        (path) => path.full != this.active!.path,
      );
    }

    this.save();

    if (triggerRedraw) {
      m.redraw();
    }
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
