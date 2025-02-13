import m from "mithril";

import { CreateItemModal } from "../../modals/bookmarks/CreateItem";
import { RoverBookmark } from "view/models/data/Base";
import { Bookmarks } from "view/models/BookmarksModel";
import { Obsidian } from "view/models/data/Obsidian";
import { ListBookmarks } from "./Bookmarks/ListBookmarks";

interface Attr {
    bookmarks: RoverBookmark[]
}

export class BookmarksView implements m.ClassComponent<Attr> {
    height: number

    onDrop(ev: DragEvent) {
        ev.preventDefault();

        if (!ev.dataTransfer) {
            console.error("ROVER: data transfer is undefined on drop");
            return;
        }

        switch (true) {
            case ev.dataTransfer.types.includes("application/rover.bookmark"): {
                Bookmarks.followAndRemove(Bookmarks.dragged)

                if (Bookmarks.saveBookmarks) {
                    Bookmarks.saveBookmarks();
                }

                break;
            }
            case ev.dataTransfer.types.includes("application/rover.file"): {

                const path = ev.dataTransfer.getData("application/rover.file");

                new CreateItemModal(Obsidian!.app, path, (name, emoji, path) => {
                    Bookmarks.items.push({ crd: Date.now(), name: name, emojicon: emoji, path: path })

                    Bookmarks.saveBookmarks()

                    m.redraw()
                }).open()

                break;

            }
        }
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div className="rover-container rover-bookmarks-container"
                ondrop={!vnode.attrs.bookmarks.length ? this.onDrop : undefined}
                ondragover={!vnode.attrs.bookmarks.length ? (ev: DragEvent) => ev.preventDefault() : undefined}>

                {vnode.attrs.bookmarks.length 
                    ? <ListBookmarks inheritedIndex={-1} items={vnode.attrs.bookmarks} nest={-1} /> 
                    : <span className="drop-large-field">Drop a file here to create a bookmark</span>}

                {vnode.attrs.bookmarks.length && Bookmarks.isFileDragStarted ?
                    <div className="drop-small-field"

                        ondrop={this.onDrop}
                        ondragover={(ev: DragEvent) => ev.preventDefault()}>
                        Drop a file here
                    </div> : null}

                {vnode.attrs.bookmarks.length && Bookmarks.dragged.length != 0 ?
                    <div className="drop-small-field"
                        ondrop={this.onDrop}
                        ondragover={(ev: DragEvent) => ev.preventDefault()}>
                        Delete a bookmark
                    </div> : null}
            </div>
        )
    }
}