import m from "mithril";
import * as utils from "utils";
import { HighlightSpace } from "./HighlightSpace";

import { Bookmarks } from "view/models/BookmarksModel";
import { ExplorerModel } from "view/models/ExplorerModel";

interface Attr {
    flattenedIndex: number,
    index: number
    name: string,
    emojicon: string,
    path: string
    nest: number,
}

export class BookmarkItem implements m.ClassComponent<Attr> {
    isDragStarted: boolean
    isDragEntered: boolean

    constructor(vnode: unknown) {
        this.isDragStarted = false;
        this.isDragEntered = false
    }

    onDragEnterLeave() {
        this.isDragEntered = !this.isDragEntered
    }

    onDragStart(ev: DragEvent, index: number, flattened: number) {
        Bookmarks.dragged = []

        ev.dataTransfer!.setData("application/rover.bookmark", index.toString()) 

        Bookmarks.dragged.push(index)
        Bookmarks.draggedFlat = flattened

        this.isDragStarted = true;
    }

    onDragEnd() {
        if (!Bookmarks.dropZone.length) {
            Bookmarks.dragged = [];
            Bookmarks.draggedFlat = undefined
        }

        this.isDragStarted = false;

        // do not bubble
        return false;
    }

    onDrop(ev: DragEvent, attr: Attr) {
        if (!ev.dataTransfer) {
            utils.error("BOOKMARK_ITEM: data transfer is undefined...")
            return
        }

        Bookmarks.locateDropZone(ev.currentTarget! as HTMLElement, attr.index)

        switch (true) {
            case ev.dataTransfer.types.includes("application/rover.bookmark"): {
                Bookmarks.openCreateFolderModal()
                break;
            }
            case ev.dataTransfer.types.includes("application/rover.file"): {
                const path = ev.dataTransfer.getData("application/rover.file")

                Bookmarks.openModifyItemModal(attr.name, attr.emojicon, path)
                break;
            }
            default:
                break;
        }
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <>
                {Bookmarks.draggedFlat != undefined && Bookmarks.draggedFlat >= vnode.attrs.flattenedIndex  ? 
                    <HighlightSpace 
                        crd={vnode.key}
                        index={vnode.attrs.index} 
                        noHighlight={this.isDragStarted} 
                        nest={vnode.attrs.nest}/> : null}
                <div className={`rover-bookmark-item ${this.isDragEntered ? "hovered" : ""}`}
                    style={`margin-left: calc(4px * ${vnode.attrs.nest})`}
                    draggable={true}
                    data-crd={vnode.key}
                    onclick={() => ExplorerModel.openFile(vnode.attrs.path)}
                    ondragenter={() => this.onDragEnterLeave()}
                    ondragleave={() => this.onDragEnterLeave()}
                    ondragstart={(ev: DragEvent) => this.onDragStart(ev, vnode.attrs.index, vnode.attrs.flattenedIndex)}
                    ondragend={() => this.onDragEnd()}
                    ondrop={!this.isDragStarted ? (ev: DragEvent) => this.onDrop(ev, vnode.attrs) : undefined}
                    ondragover={!this.isDragStarted ? (ev: DragEvent) => ev.preventDefault() : undefined}>
                    <span className="rover-emojicon">{vnode.attrs.emojicon}</span>
                    {vnode.attrs.name}
                </div>
                {Bookmarks.draggedFlat != undefined && Bookmarks.draggedFlat <= vnode.attrs.flattenedIndex ? 
                    <HighlightSpace 
                        crd={vnode.key}
                        index={vnode.attrs.index + 1} 
                        noHighlight={this.isDragStarted} 
                        nest={vnode.attrs.nest} /> : null}
            </>
        )
    }
}