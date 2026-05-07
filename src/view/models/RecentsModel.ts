import type { ObsidianAppModel } from "../../core";

export class RecentsBaseModel {
  pendingNewFolderPath?: string;
  oldFolderPath?: string;

  active?: string;
  list: string[] = [];

  constructor(private obsidian: ObsidianAppModel | undefined) {}

  update(): void {
    if (!this.obsidian) {
      console.error("ROVER: app instance is unintialized");
      return;
    }

    if (this.active) {
      this.list = [this.active, ...this.list.slice(0, 5)];
    }

    this.active = this.obsidian.workspace.getActiveFile()?.path;

    this.list = this.list.filter((path) => path != this.active);

    this.save();
  }

  save() {
    if (!this.obsidian) {
      console.error("ROVER: Obsidian API is not available");
      return;
    }

    this.obsidian.settings.recents = this.list;
    this.obsidian.save();
  }
}
