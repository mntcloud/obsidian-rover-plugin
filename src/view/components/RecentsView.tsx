/* eslint-disable @typescript-eslint/prefer-for-of */

import m from "mithril";
import { EventRef } from "obsidian";

import { Bookmarks } from "view/models/BookmarksModel";
import { Obsidian } from "view/models/data/Obsidian";
import { Explorer } from "view/models/ExplorerModel";
import { Recents } from "view/models/RecentsModel";

export class RecentsView implements m.ClassComponent {
    height: number
    vaultEvRef: EventRef[] 
    workspaceEvRef?: EventRef

    onDragStart(ev: DragEvent, path: string) {
        Bookmarks.isFileDragStarted = true

        ev.dataTransfer!.setData("application/rover.file", path)
    }

    onDragEnd() {
        Bookmarks.isFileDragStarted = false
    }

    oncreate(vnode: m.VnodeDOM<Attr, this>) {
        // TODO: rework methods to combine with FileSystem handlers 
        //       it should help to control m.redraw() more reliable
        this.vaultEvRef = [
            Obsidian!.vault.on("delete", (file) => {
                Recents.list = Recents.list.filter((path) => path != file.path)
                Recents.saveRecents()
            }),
            Obsidian!.vault.on("rename", async (file, oldPath) => {
                if (file.path == Obsidian!.workspace.getActiveFile()?.path) {
                    Recents.active = Obsidian!.workspace.getActiveFile()?.path
                    m.redraw()
                } else {
                    const index = Recents.list.indexOf(oldPath)

                    if (index > -1) {
                        Recents.list[index] = file.path
                        Recents.saveRecents()
                    }
                }
            })
        ]
		
        this.workspaceEvRef = Obsidian!.workspace.on("file-open", () => {
			Recents.updateRecents()
			m.redraw()
		});

		Recents.updateRecents()

		m.redraw()
    }

    onremove(vnode: m.VnodeDOM<Attr, this>) {
        this.vaultEvRef.forEach((ref) => Obsidian!.vault.offref(ref))
        Obsidian!.workspace.offref(this.workspaceEvRef!)
    }

    view(_vnode: m.Vnode<Attr, this>) {
        return (
            <div className="rover-container rover-recents">
                <div className="rover-file active"
                    draggable={true}
                    ondragstart={(ev: DragEvent) => this.onDragStart(ev, Recents.active!)}
                    ondragend={this.onDragEnd}>
                    {Recents.active ? Recents.active : "No active file"}
                </div>

                <div className="rover-recents-others">
                    {Recents.list.map((file) => {
                        return (
                            <div
                                className="rover-file"
                                draggable={true}
                                onclick={() => Explorer.openFile(file, true)}
                                ondragend={this.onDragEnd}
                                ondragstart={(ev: DragEvent) => this.onDragStart(ev, file)}>
                                {file}
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }
}