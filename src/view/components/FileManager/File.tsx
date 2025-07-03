import m from "mithril";

import { Menu } from "obsidian";
import { Bookmarks } from "view/models/BookmarksModel";
import { Obsidian } from "view/models/data/Obsidian";
import { Explorer } from "view/models/ExplorerModel";

interface Attr {
    name: string,
    path: string,
    nest: number,
}

export class File implements m.ClassComponent<Attr> {
    renameFieldText?: string
    isEdited: boolean

    handleInputChange(ev: Event) {
        const target = ev.target as HTMLInputElement

        this.renameFieldText = target.value
    }

    async handleEnterKey(ev: KeyboardEvent, path: string) {
        if (ev.code == "Enter") {
            const file = Obsidian!.vault.getFileByPath(path)!
            
            if (file.parent) {
                await Obsidian!.app.fileManager.renameFile(file, `${file.parent.path}/${this.renameFieldText}.${file.extension}`)
            } else {
                await Obsidian!.app.fileManager.renameFile(file, `${this.renameFieldText}.${file.extension}`)
            }

            this.isEdited = false
            this.renameFieldText = undefined
        }

        if (ev.code == "Escape") {
            this.isEdited = false
            this.renameFieldText = undefined
        }
    }

    onupdate(vnode: m.VnodeDOM<Attr, this>) {
        if (this.isEdited) {

            const input = vnode.dom.querySelector("input")!

            input?.focus({ preventScroll: true });
        } 
    }
    

    handleContextMenu(ev: PointerEvent, path: string) {
        const menu = new Menu() 
        const file = Obsidian!.vault.getFileByPath(path)!

        menu.addItem((item) => 
            item
                .setTitle("Make a copy")
                .setIcon("documents")
                .setSection("action-primary")
                .onClick(async () => { 
                    if (file.parent) {
                        await Obsidian!.vault.copy(file, `${file.parent.path}/${file.basename} new.${file.extension}`)
                    } else {
                        await Obsidian!.vault.copy(file, `${file.basename} new.${file.extension}`);
                    }
                })
        )

        menu.addItem((item) => 
            item
                .setTitle("Rename...")
                .setIcon("pen-line")
                .setSection("action-primary")
                .onClick(() => {
                    this.renameFieldText = file.basename
                    this.isEdited = true

                    m.redraw()
                })
        )

        if (file) {
            Obsidian!.workspace.trigger("file-menu", menu, file, "file-explorer-context-menu");
        } 

        menu.addItem((item) => 
            item
                .setTitle("Delete")
                .setIcon("trash")
                .setSection("danger")
                .onClick(async () => {
                    await Obsidian!.vault.trash(file, true);
                    
                })
        )


        menu.showAtMouseEvent(ev)
    }

    onDragStart(ev: DragEvent, path: string) {
        Bookmarks.isFileDragStarted = true

        ev.dataTransfer!.setData("application/rover.file", path)
    }

    onDragEnd(ev: DragEvent) {
        Bookmarks.isFileDragStarted = false
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div 
                className="rover-file" style={`margin-left: calc(6px * ${vnode.attrs.nest})`}
                draggable={true}
                ondragstart={(ev: DragEvent) => this.onDragStart(ev, vnode.attrs.path)}
                ondragend={(ev: DragEvent) => this.onDragEnd(ev)}
                oncontextmenu={(ev: PointerEvent) => this.handleContextMenu(ev, vnode.attrs.path)}
                onclick={!this.isEdited ? () => Explorer.openFile(vnode.attrs.path).then(() => m.redraw()) : undefined}>
                {!this.isEdited ? 
                    <span>{!this.renameFieldText ? vnode.attrs.name : this.renameFieldText}</span> : 
                    <input value={this.renameFieldText} 
                            oninput={((ev: Event) => this.handleInputChange(ev))} 
                            onkeydown={async (ev: KeyboardEvent) => await this.handleEnterKey(ev, vnode.attrs.path)}/>} 
            </div>
        )
    }
}