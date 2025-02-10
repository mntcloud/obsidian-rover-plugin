import { App, Vault, Workspace } from "obsidian";
import { RoverBookmark } from "./Base";

interface ObsidianAppModel {
    app: App,
    workspace: Workspace,
    vault: Vault,

    settings: RoverPluginSettings
    save: () => void, 
}

export interface RoverPluginSettings {
	mySetting: string
	bookmarks: RoverBookmark[]
    recents: string[]
}

export function initDataSource(app: App, settings: RoverPluginSettings, save: () => void) {
    Obsidian = {
        app: app, // for modals
        workspace: app.workspace,
        vault: app.vault,

        settings: settings,
        save: save
    }
}

export let Obsidian: ObsidianAppModel | undefined