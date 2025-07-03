import m from "mithril";

import { basename, dirname } from "node:path";
import { RoverFile } from "./data/Base";
import { Obsidian } from "./data/Obsidian";
import { Recents } from "./RecentsModel";
import { EventRef } from "obsidian";

class ExplorerModel {
    isBeingTested = false;
    updateWaitlist: Record<string, boolean> = {};
    evrefs: EventRef[] = [];

    listenToVault(
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) {
        this.evrefs = [
            Obsidian!.vault.on(
                "create",
                (file) => this.onCreateDelete(file.path, onDOMUpdate),
            ),
            Obsidian!.vault.on(
                "rename",
                (file, oldPath) =>
                    this.onRename(file.path, oldPath, onDOMUpdate),
            ),
            Obsidian!.vault.on(
                "delete",
                (file) => this.onCreateDelete(file.path, onDOMUpdate),
            ),
        ];
    }

    async onCreateDelete(
        file: string,
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) {
        if (this.countSegments(file)) {
            const dirpath = dirname(file);

            await onDOMUpdate(false, dirpath);
        } else {
            await onDOMUpdate(true);
        }

        if (!this.isBeingTested) {
            m.redraw();
        }
    }

    async onRename(
        curPath: string,
        oldPath: string,
        onDOMUpdate: (isRoot: boolean, path?: string) => Promise<void>,
    ) {
        const cur = curPath.split("/");
        const old = oldPath.split("/");

        // NOTE:
        // Rename handler can be invoked, when folder is renamed or moved
        // and Vault API will pass some uncessary same looking old and new paths,
        // except they have this folder as an ancestor. I'm trying to follow lazy
        // aproach here, so I don't call update several times.
        //
        // EXAMPLE:
        // NEW: dev/hacking/rover/file.md
        // OLD: dev/rnd/rover/file.md
        if (cur[cur.length - 1] != old[old.length - 1]) {
            const newPath = cur.slice(0, cur.length - 1).join("/");
            const oldPath = old.slice(0, old.length - 1).join("/");

            if (newPath == oldPath) {
                if (cur.length == 1) {
                    await onDOMUpdate(true);
                } else {
                    await onDOMUpdate(false, newPath);
                }
            } else {
                await onDOMUpdate(
                    newPath ? false : true,
                    newPath ? newPath : undefined,
                );
                await onDOMUpdate(
                    oldPath ? false : true,
                    oldPath ? oldPath : undefined,
                );
            }

            if (!this.isBeingTested) {
                m.redraw();
            }
        } else {
            const path = old.slice(0, old.length - 1).join("/");

            console.log();
            if (await Obsidian?.vault.adapter.stat(path)) {
                await onDOMUpdate(path ? false : true, path ? path : undefined);

                const newPath = cur.slice(0, cur.length - 1).join("/");

                await onDOMUpdate(
                    newPath ? false : true,
                    newPath ? newPath : undefined,
                );

                if (!this.isBeingTested) {
                    m.redraw();
                }
            }
        }
    }

    unlistenToVault() {
        for (const evref of this.evrefs) {
            Obsidian!.vault.offref(evref);
        }
    }

    countSegments(path: string) {
        let count = 0;

        for (const char of path) {
            if (char == "/") {
                count++;
            }
        }

        return count;
    }

    comparator(a: RoverFile, b: RoverFile) {
        if (a.isFolder && !b.isFolder) {
            return -1;
        } else if (!a.isFolder && b.isFolder) {
            return 1;
        } else {
            return a.name.toLocaleLowerCase().localeCompare(
                b.name.toLocaleLowerCase(),
            );
        }
    }

    async openFile(path: string, openNewTab = false) {
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
    }

    async moveFile(path: string, destination: string) {
        const file = Obsidian!.vault.getFileByPath(path)!;

        if (file.parent && file.parent.path != destination) {
            await Obsidian!.app.fileManager.renameFile(file, `${destination}/${file.name}`);
        } else {
            console.log("SAME!");
        }
    }

    async moveFolder(path: string, destination: string) {
        const file = Obsidian!.vault.getFolderByPath(path)!;

        if (file.parent && file.parent.path != destination) {
            await Obsidian!.app.fileManager.renameFile(file, `${destination}/${file.name}`);
        } else {
            console.log("SAME!");
        }
    }

    async renameFolder(path: string, newName: string) {
        const file = Obsidian!.vault.getFolderByPath(path)!;

        if (file.parent && !file.parent.isRoot()) {
            await Obsidian!.app.fileManager.renameFile(
                file,
                `${file.parent.path}/${newName}`,
            );
        } else {
            await Obsidian!.app.fileManager.renameFile(file, `${newName}`);
        }
    }

    async getFiles(path: string) {
        const files: RoverFile[] = [];

        for (const item of Obsidian!.vault.getFolderByPath(path)!.children) {
            const stat = await Obsidian!.vault.adapter.stat(item.path);

            if (!stat) {
                console.warn(`ROVER: Unable to get stat for ${item.path}`);
                continue;
            }

            files.push({
                mtime: stat!.type != "file" ? stat!.ctime : stat!.mtime,
                name: stat!.type != "folder"
                    ? basename(item.name, ".md")
                    : item.name,
                path: item.path,
                isFolder: stat!.type == "folder",
            });
        }

        files.sort(this.comparator);

        return files;
    }
}

export const Explorer = new ExplorerModel() 