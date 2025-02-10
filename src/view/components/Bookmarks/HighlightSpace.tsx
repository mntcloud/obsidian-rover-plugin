import m from "mithril";
import * as utils from "utils"
import { Bookmarks } from "view/models/BookmarksModel";

interface Attr {
    index: number,
    nest: number,
    noHighlight: boolean,
    crd: number,
}

// Highlight free space in between bookmarks 
export class HighlightSpace implements m.ClassComponent<Attr> {
    isActive: boolean

    constructor(vnode: unknown) {
        this.isActive = false
    }

    handleEnterLeave(attr: Attr) {
        if (!attr.noHighlight) {
            this.isActive = !this.isActive
        }
    }

    handleDrop(ev: DragEvent, attr: Attr) {
        if (!ev.dataTransfer) {
            utils.error("Data transfer: undefined")
            return;
        }


        if (ev.dataTransfer.types.includes("application/rover.bookmark")) {
            Bookmarks.locateDropZone(ev.currentTarget! as HTMLElement, attr.index) 

            const target = Bookmarks.followAndRemove(Bookmarks.dragged)
            Bookmarks.updatePositions(Bookmarks.dragged, Bookmarks.dropZone)

            console.log(`dispatched event dropzone: ${Bookmarks.dropZone}`)

            Bookmarks.followAndPush(Bookmarks.dropZone, target);
            Bookmarks.dropZone = []

            Bookmarks.saveBookmarks()
            m.redraw()
        }
    }

    view(vnode: m.Vnode<Attr, this>): m.Children {
        return <div
            className={`highlight-space ${this.isActive ? "active" : ""}`}
            style={`margin-left: calc(4px * ${vnode.attrs.nest})`}
            data-index={vnode.attrs.index}
            data-crd={vnode.attrs.crd}
            ondragleave={() => this.handleEnterLeave(vnode.attrs)}
            ondragenter={() => this.handleEnterLeave(vnode.attrs)}
            ondragover={!vnode.attrs.noHighlight ? (ev: DragEvent) => ev.preventDefault() : () => false}
            ondrop={!vnode.attrs.noHighlight ? (ev: DragEvent) => this.handleDrop(ev, vnode.attrs) : () => false} />
    }
}