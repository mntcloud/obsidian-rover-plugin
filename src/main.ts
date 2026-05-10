import { EventRef, Plugin, Vault, Workspace, WorkspaceLeaf } from "obsidian";
import { RoverView, VIEW_TYPE } from "rover/view/RoverSidebarView";

import { log } from "./helpers";
import { RoverPluginSettings } from "rover/core";
import { RoverSettingTab } from "./settings";

const DEFAULT_SETTINGS: RoverPluginSettings = {
  mySetting: "default",
  bookmarks: [],
  recents: [],
};

export default class RoverPlugin extends Plugin {
  settings!: RoverPluginSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE,
      (leaf) =>
        new RoverView(leaf, this.settings, (settings) => {
          this.settings = settings;
          this.saveSettings();
        }),
    );

    this.app.workspace.onLayoutReady(async () => {
      await this.activateView();
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new RoverSettingTab(this.app, this));

    log("deployed on Obsidian");
  }

  async onunload() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);

    leaves.forEach((leaf) => {
      leaf.detach();
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;

    const leaves = workspace.getLeavesOfType(VIEW_TYPE);

    if (!leaves.length) {
      const leaf: WorkspaceLeaf | null = workspace.getLeftLeaf(false)!;

      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
  }
}
