import { Obsidian } from "./data/Obsidian"

interface RecentsModel { 
    pendingNewFolderPath?: string
    oldFolderPath?: string

    active?: string,
    list: string[],
    
    updateRecents: () => void,
    saveRecents: () => void,
}

export const Recents: RecentsModel = {
    list: [],

    updateRecents() {
        if (!Obsidian) {
            console.error("ROVER: app instance is unintialized")
            return
        }

        if (Recents.active) {
            Recents.list = [Recents.active, ...Recents.list.slice(0, 5)]
        }

        Recents.active = Obsidian.workspace.getActiveFile()?.path

        Recents.list = Recents.list.filter((path) => path != Recents.active)

        Recents.saveRecents()
    },

    saveRecents() {
        if (!Obsidian) {
            console.error("ROVER: Obsidian API is not available")
            return
        }

        Obsidian.settings.recents = Recents.list
        Obsidian.save()
    },
}