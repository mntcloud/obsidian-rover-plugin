import m from "mithril";

import { basename, dirname } from "node:path";
import { RoverFile } from "./data/Base";
import { Obsidian } from "./data/Obsidian";
import { Recents } from "./RecentsModel";
import { EventRef, TAbstractFile } from "obsidian";

export interface FileManagerBaseModel {
    evrefs: EventRef[];
    updateWaitlist: Record<string, boolean>;

    countSegments: (path: string) => number;

    listenToVault: (
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) => void;
    onRename: (
        file: TAbstractFile,
        oldPath: string,
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) => Promise<void>;
    onCreateDelete: (
        file: string,
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) => void;
    unlistenToVault: () => void;

    renameFolder: (path: string, newName: string) => Promise<void>;
    moveFile: (path: string, destination: string) => Promise<void>;

    getFiles: (path: string) => Promise<RoverFile[]>;
    openFile: (path: string, openNewTab?: boolean) => Promise<void>;
}

export const ExplorerModel: FileManagerBaseModel = {
    updateWaitlist: {},
    evrefs: [],

    listenToVault(
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) {
        ExplorerModel.evrefs = [
            Obsidian!.vault.on(
                "create",
                (file) => this.onCreateDelete(file.path, onDOMUpdate),
            ),
            Obsidian!.vault.on(
                "rename",
                (file, oldPath) => this.onRename(file, oldPath, onDOMUpdate),
            ),
            Obsidian!.vault.on(
                "delete",
                (file) => this.onCreateDelete(file.path, onDOMUpdate),
            ),
        ];
    },

    async onCreateDelete(
        file: string,
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) {
        if (ExplorerModel.countSegments(file)) {
            const dirpath = dirname(file);

            await onDOMUpdate(false, dirpath);
        } else {
            await onDOMUpdate(true);
        }

        m.redraw()
    },

    async onRename(
        file: TAbstractFile,
        oldPath: string,
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) {
        const path = file.path.split("/");
        const old = oldPath.split("/");

        // NOTE:
        // Rename handler can be invoked, when folder is renamed
        // and Vault API will pass some uncessary new and old paths with one thing in common
        // that they have as an ancestor this folder
        //
        // We only execute updates when file's or folder's
        // new name and old name are not the same
        //
        // EXAMPLE:
        // NEW: dev/hacking/rover/file.md
        // OLD: dev/rnd/rover/file.md
        if (path.last() != old.last()) {
            if (path.length == old.length) {
                if (path.length == 1) {
                    await onDOMUpdate(true);

                    m.redraw();
                } else {
                    const dirpath = dirname(file.path);

                    await onDOMUpdate(false, dirpath);
                    m.redraw();
                    console.log(`Invoked redraw: ${performance.now()}`);
                }
            } else {
                if (old.length == 1 || path.length == 1) {
                    await onDOMUpdate(true);

                    const dirpath = dirname(
                        old.length < path.length ? file.path : oldPath,
                    );
                    await onDOMUpdate(false, dirpath);

                    m.redraw();
                } else {
                    const oldDirPath = dirname(oldPath);
                    const newDirPath = dirname(file.path);

                    await onDOMUpdate(false, oldDirPath);
                    await onDOMUpdate(false, newDirPath);
                    
                    m.redraw();
                }
            }
        } else {
            if (path.length == old.length) {
                // we need to check for existence of folder or file,
                // because if rename happens, folder in old path doesn't match the new one
                // and also it doesn't exists anymore and move happens only in existent folders
                for (let i = old.length - 1; i >= 0; i--) {
                    if (old[i] != path[i]) {
                        const oldPartialPath = old.slice(0, i + 1).join("/");
                        const stat = await Obsidian!.vault.adapter.stat(
                            oldPartialPath,
                        );

                        if (stat) {
                            const oldDirPath = dirname(oldPath);
                            const newDirPath = dirname(file.path);

                            await onDOMUpdate(false, oldDirPath);
                            await onDOMUpdate(false, newDirPath);

                            m.redraw();
                        } else {
                            break;
                        }
                    }
                }
            } else {
                const oldDirPath = dirname(oldPath);
                const newDirPath = dirname(file.path);

                await onDOMUpdate(false, oldDirPath);
                await onDOMUpdate(false, newDirPath);

                m.redraw();
            }
        }
    },  

    unlistenToVault() {
        for (const evref of ExplorerModel.evrefs) {
            Obsidian!.vault.offref(evref);
        }
    },

    countSegments(path) {
        let count = 0;

        for (const char of path) {
            if (char == "/") {
                count++;
            }
        }

        return count;
    },

    async openFile(path, openNewTab = false) {
        if (!Obsidian) {
            console.error("ROVER: workspace is not initialized");
            return;
        }

        const leaf = Obsidian.workspace.getLeaf(openNewTab);
        const file = Obsidian.vault.getFileByPath(path);

        if (file) {
            Recents.updateRecents();
            await leaf.openFile(file);
        }
    },

    async moveFile(path: string, destination: string) {
        const file = Obsidian!.vault.getFileByPath(path)!;

        if (file.parent && file.parent.path != destination) {
            await Obsidian!.vault.rename(file, `${destination}/${file.name}`);
        } else {
            console.log("SAME!");
        }
    },

    async renameFolder(path: string, newName: string) {
        const file = Obsidian!.vault.getFolderByPath(path)!;

        if (file.parent && !file.parent.isRoot()) {
            await Obsidian!.vault.rename(
                file,
                `${file.parent.path}/${newName}`,
            );
        } else {
            await Obsidian!.vault.rename(file, `${newName}`);
        }
    },

    async getFiles(path: string) {
        const files: RoverFile[] = [];

        for (const item of Obsidian!.vault.getFolderByPath(path)!.children) {
            const stat = await Obsidian!.vault.adapter.stat(item.path);

            files.push({
                mtime: stat!.mtime,
                name: stat!.type != "folder"
                    ? basename(item.name, ".md")
                    : item.name,
                path: item.path,
                isFolder: stat!.type == "folder",
            });
        }

        files.sort((fileA, fileB) => fileA.isFolder ? -1 : 0);

        return files;
    },
};
