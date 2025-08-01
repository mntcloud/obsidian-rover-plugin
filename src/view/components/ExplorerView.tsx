import { basename } from "node:path";

import m from "mithril";

import { File } from "./FileManager/File";
import { Folder } from "./FileManager/Folder";
import { RoverFile } from "view/models/data/Base";
import { Obsidian } from "view/models/data/Obsidian";
import { Explorer } from "view/models/ExplorerModel";
import { TAbstractFile } from "obsidian";

export class ExplorerView implements m.ClassComponent {
    root: RoverFile[];
    dom: Element;

    highlight = false;

    oninit(vnode: m.Vnode<Attr, this>) {
        this.root = [];
        this.structureUpdate().then(() => m.redraw());
    }

    async onVaultUpdate(isRoot: boolean, path?: string) {
        if (isRoot && !path) {
            await this.structureUpdate();

            console.log(`ROOT UPDATE: ${performance.now()}`);
        } else {
            const element = this.dom.querySelector(`div[data-path="${path}"]`);

            if (element) {
                await new Promise((resolve) => {
                    element.dispatchEvent(
                        new CustomEvent("createdelete", {
                            detail: { complete: resolve },
                            bubbles: false,
                        }),
                    );
                });
            }
        }
    }

    onDragEnterExit() {
        this.highlight = !this.highlight;
    }

    onDragEnd() {
        this.highlight = false;
    }

    async onDrop(ev: DragEvent) {
        ev.preventDefault();
        ev.stopPropagation();

        if (ev.dataTransfer && ev.dataTransfer.items.length == 1) {
            let file: TAbstractFile | null = null;            

            switch (ev.dataTransfer.items[0].type) {
                case "application/rover.file": {
                    const path = ev.dataTransfer!.getData(
                        "application/rover.file",
                    );

                    file = Obsidian!.vault.getFileByPath(path)
                    break;
                }
                case "application/rover.folder": {
                    const path = ev.dataTransfer!.getData(
                        "application/rover.folder",
                    );

                    file = Obsidian!.vault.getFolderByPath(path)
                }
            }

            if (file) {
                await Obsidian!.app.fileManager.renameFile(file, file.name)
            }
        }
    }

    oncreate(vnode: m.VnodeDOM<Attr, this>) {
        this.dom = vnode.dom
        Explorer.listenToVault(this.onVaultUpdate.bind(this));
    }

    onremove(vnode: m.VnodeDOM<Attr, this>) {
        Explorer.unlistenToVault()
    }

    async structureUpdate() {
        const newRoot = [];
        const workspaceRoot = Obsidian!.vault.getRoot();

        for (const item of workspaceRoot.children) {
            const stat = await Obsidian!.vault.adapter.stat(item.path);

            newRoot.push({
                mtime: stat!.ctime,
                name: stat!.type != "folder"
                    ? basename(item.name, ".md")
                    : item.name,
                path: item.path,
                isFolder: stat!.type == "folder",
            });
        }

        newRoot.sort(Explorer.comparator);
        this.root = newRoot;
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div
                className={`rover-container rover-file-manager ${
                    this.highlight ? "highlight" : ""
                }`}
                ondragenter={() => this.onDragEnterExit()}
                ondragleave={() => this.onDragEnterExit()}
                ondragend={() => this.onDragEnd()}
                ondragover={(ev: DragEvent) => ev.preventDefault()}
                ondrop={async (ev: DragEvent) => await this.onDrop(ev)}
            >
                {this.root.length
                    ? this.root.map((file) => {
                        return file.isFolder
                            ? (
                                <Folder
                                    key={file.mtime}
                                    name={file.name}
                                    path={file.path}
                                    nest={0}
                                />
                            )
                            : (
                                <File
                                    key={file.mtime}
                                    name={file.name}
                                    path={file.path}
                                    nest={0}
                                />
                            );
                    })
                    : undefined}
            </div>
        );
    }
}
