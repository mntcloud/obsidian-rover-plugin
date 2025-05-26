import m from "mithril";
import { File } from "./File";
import { RoverFile } from "view/models/data/Base";
import { ExplorerModel } from "view/models/ExplorerModel";
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

    renameFieldText?: string;
    isEdited: boolean;

    handleInputChange(ev: Event) {
        const target = ev.target as HTMLInputElement;

        this.renameFieldText = target.value
    }

    async handleEnterKey(ev: KeyboardEvent, path: string) {
        if (ev.code == "Enter") {
            if (this.renameFieldText) {
                await ExplorerModel.renameFolder(path, this.renameFieldText) 
            }

            this.isEdited = false
            this.renameFieldText = undefined
        }

        if (ev.code == "Escape") {
            this.isEdited = false
            this.renameFieldText = undefined
        }
    }

    oninit(vnode: m.Vnode<Attr, this>) {
        this.nested = []
        this.capturedPath = vnode.attrs.path
        this.isDragEntered = false
        this.isEdited = false
    }

    async onCreateDelete(path: string, complete: () => void) {
        if (this.nested.length) {
            this.nested = await ExplorerModel.getFiles(path)
        }

        console.log(`FOLDER ${path} ${performance.now()}: nested create delete and redraw`)
        complete()
    }


    handleDragEnterExit(attr: Attr) { 
        if (!this.isDragEntered) {
            this.timeoutId = setTimeout(() => this.reveal(attr.path), 1500)
        } else {
            clearTimeout(this.timeoutId)
        }

        this.isDragEntered = !this.isDragEntered

        return false
    }

    onupdate(vnode: m.VnodeDOM<Attr, this>) {
        if (vnode.attrs.path != this.capturedPath && this.nested.length) {
            console.log(`New path: ${vnode.attrs.path} vs ${this.capturedPath}`)

            ExplorerModel.getFiles(vnode.attrs.path).then((files) => {
                this.nested = files
                m.redraw()
            })

            this.capturedPath = vnode.attrs.path 
        }

        if (this.isEdited) {
            const input = vnode.dom.querySelector("input")!

            input?.focus()
        } 
    }

    async handleDrop(ev: DragEvent, targetPath: string) {
        clearTimeout(this.timeoutId)
    
        ev.preventDefault()
        ev.stopPropagation()

        const path = ev.dataTransfer!.getData("application/rover.file"); 
        await ExplorerModel.moveFile(path, targetPath)

        this.isDragEntered = false        
        m.redraw()
    }

    handleContextMenu(ev: PointerEvent, path: string) {
        const menu = new Menu()
        const folder = Obsidian!.vault.getFolderByPath(path)!

        menu.addItem((item) =>
            item
                .setTitle("New subfolder")
                .setIcon("folder-plus")
                .setSection("action-primary")
                .onClick(async () => {
                    await Obsidian!.vault.adapter.mkdir(`${folder.path}/Untitled`)
                })
        )

        menu.addItem((item) =>
            item
                .setTitle("Rename...")
                .setIcon("folder-pen")
                .setSection("action")
                .onClick(() => {
                    this.renameFieldText = folder.name
                    this.isEdited = true

                    m.redraw()
                })
        )


        menu.addItem((item) =>
            item
                .setTitle("Delete")
                .setIcon("trash")
                .setSection("danger")
                .onClick(async () => {
                    await Obsidian!.vault.trash(folder, false)
                })
        )

        if (folder) {
            Obsidian!.workspace.trigger("file-menu", menu, folder, "file-explorer-context-menu");
        }

        menu.showAtMouseEvent(ev)
    }

    async reveal(path: string) {
        if (this.nested.length) {
            this.nested = []
        } else {
            const files = await ExplorerModel.getFiles(path)

            if (files) {
                this.nested = files
            }
        }

        m.redraw()
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div className={`rover-folder-container ${this.isDragEntered ? "hovered" : ""}`}
                oncreatedelete={async (ev: CustomEvent<{ complete: () => void}>) => await this.onCreateDelete(vnode.attrs.path, ev.detail.complete)}
                ondrop={async (ev: DragEvent) => await this.handleDrop(ev, vnode.attrs.path)}
                ondragenter={(ev: DragEvent) => this.handleDragEnterExit(vnode.attrs)}
                ondragleave={(ev: DragEvent) => this.handleDragEnterExit(vnode.attrs)}
                ondragover={(ev: DragEvent) => ev.preventDefault()}
                data-path={this.nested.length ? vnode.attrs.path : undefined}>
                <div className={`rover-folder ${this.nested.length ? "expanded" : ""}`}
                    oncontextmenu={(ev: PointerEvent) => this.handleContextMenu(ev, vnode.attrs.path)}
                    onclick={!this.isEdited ? async () => await this.reveal(vnode.attrs.path) : undefined}
                    style={`margin-left: calc(4px * ${vnode.attrs.nest})`}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24" height="24" viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round"
                        class="rover-lucide lucide-folder">
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                    {!this.isEdited ?
                        <span>{!this.renameFieldText ? vnode.attrs.name : this.renameFieldText}</span> :
                        <input value={this.renameFieldText}
                            oninput={((ev: Event) => this.handleInputChange(ev))}
                            onkeydown={async (ev: KeyboardEvent) => await this.handleEnterKey(ev, vnode.attrs.path)} />}
                </div>
                {this.nested.map((file) => {
                    return file.isFolder ?
                        <Folder key={file.mtime} name={file.name} nest={vnode.attrs.nest + 1} path={file.path} /> :
                        <File key={file.mtime} name={file.name} path={file.path} nest={vnode.attrs.nest + 1} />
                })}
            </div>
        )
    }
}