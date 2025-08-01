import { basename } from "node:path";

import m from "mithril";

import { File } from "./FileManager/File";
import { Folder } from "./FileManager/Folder";
import { RoverFile } from "view/models/data/Base";
import { Obsidian } from "view/models/data/Obsidian";
import { Explorer } from "view/models/ExplorerModel";
import { Menu, TAbstractFile } from "obsidian";

export class ExplorerView implements m.ClassComponent {
    root: RoverFile[];
    dom: Element;

    action?: {
        mode: "create";
        value: string;
    };

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

    onInputChange(ev: Event) {
        const target = ev.target as HTMLInputElement;

        if (this.action) {
            this.action.value = target.value;
        }
    }

    async onEnterKey(ev: KeyboardEvent) {
        if (ev.code == "Enter") {
            if (this.action && this.action.mode === "create") {
                await Obsidian!.vault.adapter.mkdir(
                    `${this.action.value}`,
                );
            }

            this.action = undefined;
        }

        if (ev.code == "Escape") {
            this.action = undefined;
        }

        m.redraw();
    }

    onContextMenu(ev: PointerEvent) {
        const menu = new Menu();
        const file = Obsidian!.vault.getRoot();

        menu.addItem((item) =>
            item
                .setTitle("New subfolder")
                .setIcon("folder-plus")
                .setSection("action-primary")
                .onClick(async () => {
                    this.action = {
                        mode: "create",
                        value: "",
                    };

                    m.redraw();
                })
        );

        Obsidian!.workspace.trigger(
            "file-menu",
            menu,
            file,
            "file-explorer-context-menu",
        );

        menu.showAtMouseEvent(ev);
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
                oncontextmenu={(ev: PointerEvent) => this.onContextMenu(ev)}
            >
                {this.action && this.action.mode === "create"
                    ? (
                        <div class="rover-action-create">
                            <button
                                class="clickable-icon"
                                onclick={() => {
                                    this.action = undefined;
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="rover-lucide lucide-folder-x"
                                >
                                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                                    <path d="m9.5 10.5 5 5" />
                                    <path d="m14.5 10.5-5 5" />
                                </svg>
                            </button>
                            <input
                                value={this.action.value}
                                oninput={(ev: Event) =>
                                    this.onInputChange(ev)}
                                onkeydown={async (ev: KeyboardEvent) =>
                                    await this.onEnterKey(ev)}
                                placeholder="New folder"
                            />
                        </div>
                    )
                    : null}
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
