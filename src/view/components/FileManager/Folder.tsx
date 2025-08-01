import m from "mithril";
import { File } from "./File";
import { RoverFile } from "view/models/data/Base";
import { Explorer } from "view/models/ExplorerModel";
import { Obsidian } from "view/models/data/Obsidian";
import { Menu } from "obsidian";

interface Attr {
    name: string;
    nest: number;
    path: string;
}

export class Folder implements m.ClassComponent<Attr> {
    nested: RoverFile[];

    isDragEntered: boolean;
    timeoutId?: NodeJS.Timeout;

    capturedPath?: string;

    action?: {
        mode: "create" | "rename";
        value: string;
    };

    handleInputChange(ev: Event) {
        const target = ev.target as HTMLInputElement;

        if (this.action) {
            this.action.value = target.value;
        }
    }

    async handleEnterKey(ev: KeyboardEvent, path: string) {
        if (ev.code == "Enter") {
            if (this.action && this.action.mode === "rename") {
                await Explorer.renameFolder(path, this.action.value);
            }

            if (this.action && this.action.mode === "create") {
                await Obsidian!.vault.adapter.mkdir(
                    `${path}/${this.action.value}`,
                );
            }

            this.action = undefined;
        }

        if (ev.code == "Escape") {
            this.action = undefined;
        }

        m.redraw()
    }

    oninit(vnode: m.Vnode<Attr, this>) {
        this.nested = [];
        this.capturedPath = vnode.attrs.path;
        this.isDragEntered = false;
        this.action = undefined;
    }

    async onCreateDelete(path: string, complete: () => void) {
        if (this.nested.length) {
            this.nested = await Explorer.getFiles(path);
        }
        console.log(
            `FOLDER ${path} ${performance.now()}: nested create delete and redraw`,
        );
        complete();
    }

    handleDragEnterExit(attr: Attr) {
        console.log(`FOLDER ${attr.path} drag enter/exit: ${!this.isDragEntered}`);
        if (!this.isDragEntered) {
            this.timeoutId = setTimeout(() => this.reveal(attr.path), 1500);
        } else {
            clearTimeout(this.timeoutId);
        }

        this.isDragEntered = !this.isDragEntered;

        return false;
    }

    onupdate(vnode: m.VnodeDOM<Attr, this>) {
        if (vnode.attrs.path != this.capturedPath && this.nested.length) {
            console.log(
                `New path: ${vnode.attrs.path} vs ${this.capturedPath}`,
            );

            Explorer.getFiles(vnode.attrs.path).then((files) => {
                this.nested = files;
                m.redraw();
            });

            this.capturedPath = vnode.attrs.path;
        }

        if (this.action && this.action.mode === "rename") {
            const input = vnode.dom.querySelector("input")!;

            input?.focus({ preventScroll: true });
        }
    }

    async handleDrop(ev: DragEvent, targetPath: string) {
        clearTimeout(this.timeoutId);

        ev.preventDefault();
        ev.stopPropagation();

        if (ev.dataTransfer && ev.dataTransfer.items.length == 1) {
            switch (ev.dataTransfer.items[0].type) {
                case "application/rover.file": {
                    const path = ev.dataTransfer!.getData(
                        "application/rover.file",
                    );

                    await Explorer.moveFile(path, targetPath);
                    break;
                }
                case "application/rover.folder": {
                    const path = ev.dataTransfer!.getData(
                        "application/rover.folder",
                    );

                    if (path === targetPath) {
                        break;
                    }

                    await Explorer.moveFolder(path, targetPath);
                }
            }
        }

        this.isDragEntered = false;
        m.redraw();
    }

    handleContextMenu(ev: PointerEvent, path: string) {
        const menu = new Menu();
        const folder = Obsidian!.vault.getFolderByPath(path)!;

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

                    if (!this.nested.length) {
                        this.nested = await Explorer.getFiles(path);
                    }

                    m.redraw();
                })
        );

        menu.addItem((item) =>
            item
                .setTitle("Rename...")
                .setIcon("folder-pen")
                .setSection("action")
                .onClick(() => {
                    this.action = {
                        mode: "rename",
                        value: folder.name,
                    };

                    m.redraw();
                })
        );

        menu.addItem((item) =>
            item
                .setTitle("Delete")
                .setIcon("trash")
                .setSection("danger")
                .onClick(async () => {
                    await Obsidian!.vault.trash(folder, false);
                })
        );

        if (folder) {
            Obsidian!.workspace.trigger(
                "file-menu",
                menu,
                folder,
                "file-explorer-context-menu",
            );
        }

        menu.showAtMouseEvent(ev);

        return false;
    }

    async reveal(path: string) {
        if (this.nested.length) {
            this.nested = [];
        } else {
            const files = await Explorer.getFiles(path);

            if (files) {
                this.nested = files;
            }
        }

        m.redraw();
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div
                className={`rover-folder-container ${
                    this.isDragEntered ? "hovered" : ""
                }`}
                oncreatedelete={async (
                    ev: CustomEvent<{ complete: () => void }>,
                ) => await this.onCreateDelete(
                    vnode.attrs.path,
                    ev.detail.complete,
                )}
                ondrop={async (ev: DragEvent) =>
                    await this.handleDrop(ev, vnode.attrs.path)}
                ondragenter={(ev: DragEvent) =>
                    this.handleDragEnterExit(vnode.attrs)}
                ondragleave={(ev: DragEvent) =>
                    this.handleDragEnterExit(vnode.attrs)}
                ondragover={(ev: DragEvent) => ev.preventDefault()}
                data-path={this.nested.length ? vnode.attrs.path : undefined}
            >
                <div
                    className={`rover-folder ${
                        this.nested.length ? "expanded" : ""
                    }`}
                    draggable={true}
                    oncontextmenu={(ev: PointerEvent) =>
                        this.handleContextMenu(ev, vnode.attrs.path)}
                    onclick={!this.action
                        ? async () => await this.reveal(vnode.attrs.path)
                        : undefined}
                    ondragstart={(ev: DragEvent) => {
                        ev.dataTransfer!.setData(
                            "application/rover.folder",
                            vnode.attrs.path,
                        );
                    }}
                    style={`margin-left: calc(6px * ${vnode.attrs.nest})`}
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
                        class="rover-lucide lucide-folder"
                    >
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                    {this.action && this.action.mode === "rename"
                        ? (
                            <input
                                value={this.action.value}
                                oninput={(ev: Event) =>
                                    this.handleInputChange(ev)}
                                onkeydown={async (ev: KeyboardEvent) =>
                                    await this.handleEnterKey(
                                        ev,
                                        vnode.attrs.path,
                                    )}
                            />
                        )
                        : (
                            <span>
                                {vnode.attrs.name}
                            </span>
                        )}
                </div>
                {this.action && this.action.mode === "create"
                    ? (
                        <div
                            class="rover-action-create"
                            style={`margin-left: calc(6px * ${vnode.attrs.nest} - ${vnode.attrs.nest}); padding: 0 calc(6px * ${vnode.attrs.nest});`}
                        >
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
                                    this.handleInputChange(ev)}
                                onkeydown={async (ev: KeyboardEvent) =>
                                    await this.handleEnterKey(
                                        ev,
                                        vnode.attrs.path,
                                    )}
                                placeholder="New folder"
                            />
                        </div>
                    )
                    : null}
                {this.nested.map((file) => {
                    return file.isFolder
                        ? (
                            <Folder
                                key={file.mtime}
                                name={file.name}
                                nest={vnode.attrs.nest + 1}
                                path={file.path}
                            />
                        )
                        : (
                            <File
                                key={file.mtime}
                                name={file.name}
                                path={file.path}
                                nest={vnode.attrs.nest + 1}
                            />
                        );
                })}
            </div>
        );
    }
}
