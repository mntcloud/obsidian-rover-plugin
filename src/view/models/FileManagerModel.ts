import { basename } from "node:path";
import { RoverFile } from "./data/Base";
import { Obsidian } from "./data/Obsidian";
import { Recents } from "./RecentsModel";

export interface FileManagerBaseModel {
    countSegments: (path: string) => number,
    getFiles: (path: string) => Promise<RoverFile[]>,
    openFile: (path: string, openNewTab?: boolean) => Promise<void>
}

export const FileModel: FileManagerBaseModel = { 
    countSegments(path) {
        let count = 0
        
        for (const char of path) {
            if (char == "/") {
                count++
            }
        }

        return count
    },
    
    async openFile(path, openNewTab = false) {
        if (!Obsidian) {
            console.error("ROVER: workspace is not initialized");
            return
        }

        const leaf = Obsidian.workspace.getLeaf(openNewTab);
        const file = Obsidian.vault.getFileByPath(path)

        if (file) {
            Recents.updateRecents()
            await leaf.openFile(file)
        }
    },

    async getFiles(path: string) {
        const files: RoverFile[] = []
        
        for (const item of Obsidian!.vault.getFolderByPath(path)!.children) {
            const stat = await Obsidian!.vault.adapter.stat(item.path)

            if (stat) { // file exists
                files.push({
                    mtime: stat!.ctime,
                    name: stat!.type != "folder" ? basename(item.name, ".md") : item.name,
                    path: item.path,
                    isFolder: stat!.type == "folder"
                })
            }
        }

        files.sort((fileA, fileB) => fileA.isFolder ? -1 : 0)
        
        return files
    }
}