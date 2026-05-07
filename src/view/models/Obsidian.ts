import { App } from "obsidian";
import { RoverPluginSettings, ObsidianAppModel } from "../../core";

export function init(
  app: App,
  settings: RoverPluginSettings,
  save: () => void,
) {
  Obsidian = {
    app: app, // for modals
    workspace: app.workspace,
    vault: app.vault,

    settings: settings,
    save: save,
  };
}

export let Obsidian: ObsidianAppModel | undefined;
