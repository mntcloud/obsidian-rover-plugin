import { EventRef, TFile } from "obsidian";
import type { ObsidianAppModel, RoverRecentsStore } from "rover/core";

import m from "mithril";
import { extname } from "node:path";

export class RecentsBaseModel {
  pendingNewFolderPath?: string;
  oldFolderPath?: string;

  active: TFile | null = null;
  previous: RoverRecentsStore[] = [];

  vaultEvRef: EventRef[] = [];
  workspaceEvRef?: EventRef;

  constructor(private obsidian: ObsidianAppModel | undefined) {}

  attachListeners() {
    // TODO: rework methods to combine with FileSystem handlers
    //       it should help to control m.redraw() more reliable
    this.vaultEvRef = [
      this.obsidian!.vault.on("delete", (file) => {
        this.previous = this.previous.filter((path) => path.full != file.path);

        this.save();
        m.redraw();
      }),
      this.obsidian!.vault.on("rename", async (file, oldPath) => {
        if (file.path == this.obsidian!.workspace.getActiveFile()?.path) {
          this.active = this.obsidian!.workspace.getActiveFile();
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
    ];

    this.workspaceEvRef = this.obsidian!.workspace.on("file-open", () => {
      this.update();
    });
  }

  detachListeners() {
    this.vaultEvRef.forEach((ref) => this.obsidian!.vault.offref(ref));
    this.obsidian!.workspace.offref(this.workspaceEvRef!);
  }

  update(): void {
    if (!this.obsidian) {
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

    this.active = this.obsidian.workspace.getActiveFile();

    if (this.active) {
      this.previous = this.previous.filter(
        (path) => path.full != this.active!.path,
      );
    }

    this.save();
    m.redraw();
  }

  save() {
    if (!this.obsidian) {
      console.error("ROVER: Obsidian API is not available");
      return;
    }

    this.obsidian.settings.recents = this.previous;
    this.obsidian.save();
  }
}
