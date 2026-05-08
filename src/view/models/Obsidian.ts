import { App } from "obsidian";
import { RoverPluginSettings, ObsidianAppModel } from "../../core";

let backingValue: ObsidianAppModel | undefined = undefined;

export function init(
  app: App,
  settings: RoverPluginSettings,
  save: () => void,
) {
  backingValue = {
    app: app, // for modals
    vault: app.vault,
    workspace: app.workspace,

    settings: settings,
    save: save,
  };
}

// We need a reliable reference
// to pass as a models constructor argument at models import
export let Obsidian = new Proxy(
  {},
  {
    get(target, prop, receiver) {
      if (backingValue) {
        return Reflect.get(backingValue, prop, receiver);
      }

      console.log("fuck, doesn't work...");
    },
  },
) as ObsidianAppModel;
