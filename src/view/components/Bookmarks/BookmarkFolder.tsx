import m from "mithril";

import { ListBookmarks } from "./ListBookmarks";
import { RoverBookmark } from "view/models/data/Base";
import { Bookmarks } from "view/models/BookmarksModel";
import { HighlightSpace } from "./HighlightSpace";


interface Attr {
    flattenedIndex: number,
    index: number,
    name: string,
    emojicon: string,
    bookmarks: RoverBookmark[],
    nest: number,
}

export class BookmarkFolder implements m.ClassComponent<Attr> {
    isDragStarted: boolean
    isCollapsed: boolean

    oninit(vnode: m.Vnode<Attr, this>) {
        this.isCollapsed = !Bookmarks.isTesting
    }

    oncreate(vnode: m.VnodeDOM<Attr, this>) {
        vnode.dom.addEventListener("locateDropZone", (ev: Event) => this.handlePopulateDropZone(ev))
    }

    handlePopulateDropZone(ev: Event) {
        const currentTarget = ev.currentTarget as HTMLElement
        const target = ev.target as HTMLElement

        if (currentTarget.dataset.crd != target.dataset.crd) {
            const index = Number.parseInt(currentTarget.dataset.index!)
            Bookmarks.dropZone.push(index)
        }
    }

    onContainerDragStart(ev: DragEvent, attr: Attr) {
        const current = ev.currentTarget as HTMLElement
        const target = ev.target as HTMLElement

        if (current.dataset.crd != target.dataset.crd) {
            Bookmarks.dragged.push(attr.index)
        }

    }

    onFolderDragStart(ev: DragEvent, index: number, flattened: number) {
        ev.dataTransfer!.setData("application/rover.bookmark", index.toString())
        Bookmarks.draggedFlat = flattened
        Bookmarks.dragged = [index]
        this.isDragStarted = true;
    }

    handleDrop(ev: DragEvent, attr: Attr) {
        Bookmarks.locateDropZone(ev.currentTarget! as HTMLElement, attr.index)

        const dragged = Bookmarks.followAndRemove(Bookmarks.dragged)
        Bookmarks.updatePositions(Bookmarks.dragged, Bookmarks.dropZone)

        const folder = Bookmarks.follow(Bookmarks.dropZone)[Bookmarks.dropZone[0]]

        if (folder.children) {
            folder.children = [dragged, ...folder.children]
        } else {
            folder.children = [dragged]
        }

        Bookmarks.dropZone = []
        Bookmarks.saveBookmarks()
        m.redraw()
    }

    onDragEnd() {
        Bookmarks.dragged = [];
        Bookmarks.draggedFlat = undefined;
        this.isDragStarted = false;

        // do not bubble
        return false;
    }


    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div className="rover-bookmark-folder-container"
                data-index={vnode.attrs.index}
                data-crd={vnode.key}
                ondragstart={(ev: DragEvent) => this.onContainerDragStart(ev, vnode.attrs)}>
                {Bookmarks.draggedFlat && Bookmarks.draggedFlat >= vnode.attrs.flattenedIndex ?
                    <HighlightSpace
                        crd={vnode.key}
                        index={vnode.attrs.index}
                        noHighlight={this.isDragStarted}
                        nest={vnode.attrs.nest} /> : null}

                <div className="rover-bookmark-folder"
                    style={`margin-left: calc(4px * ${vnode.attrs.nest})`}
                    draggable={true}
                    data-index={vnode.attrs.index}
                    data-crd={vnode.key}
                    ondrop={(ev: DragEvent) => this.handleDrop(ev, vnode.attrs)}
                    ondragstart={(ev: DragEvent) => this.onFolderDragStart(ev, vnode.attrs.index, vnode.attrs.flattenedIndex)}
                    ondragover={(ev: DragEvent) => ev.preventDefault()}
                    ondragend={() => this.onDragEnd()}
                    onclick={() => { this.isCollapsed = !this.isCollapsed }}>
                    <span className="rover-emojicon">{vnode.attrs.emojicon}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="rover-lucide lucide-chevron-right">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                    {vnode.attrs.name}
                </div>

                {!this.isCollapsed ?
                    <ListBookmarks
                        inheritedIndex={vnode.attrs.flattenedIndex}
                        items={vnode.attrs.bookmarks}
                        nest={vnode.attrs.nest} /> : null}


                {Bookmarks.draggedFlat && Bookmarks.draggedFlat <= vnode.attrs.flattenedIndex ?
                    <HighlightSpace
                        crd={vnode.key}
                        index={vnode.attrs.index + 1}
                        noHighlight={this.isDragStarted}
                        nest={vnode.attrs.nest} /> : null}
            </div>
        )
    }
}