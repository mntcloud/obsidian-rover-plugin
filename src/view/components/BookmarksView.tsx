import m from "mithril";

import { CreateItemModal } from "../../modals/bookmarks/CreateItem";
import { RoverBookmark } from "rover/core";
import { Bookmarks } from "rover/view/models";
import { ListBookmarks } from "./Bookmarks/ListBookmarks";

interface Attr {
  bookmarks: RoverBookmark[];
}

export class BookmarksView implements m.ClassComponent<Attr> {
  oncreate(vnode: m.VnodeDOM<Attr, this>) {
    Bookmarks.listenToVault();
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();

    if (!ev.dataTransfer) {
      console.error("ROVER: data transfer is undefined on drop");
      return;
    }

    switch (true) {
      case ev.dataTransfer.types.includes("application/rover.file"): {
        const path = ev.dataTransfer.getData("application/rover.file");

        Bookmarks.openModal("createItem", { pos: [], path });
        break;
      }
    }
  }

  view(vnode: m.Vnode<Attr, this>) {
    return (
      <div
        className="rover-container rover-bookmarks-container"
        ondrop={!vnode.attrs.bookmarks.length ? this.onDrop : undefined}
        ondragover={(ev: DragEvent) => ev.preventDefault()}
      >
        {vnode.attrs.bookmarks.length ? (
          <ListBookmarks
            items={vnode.attrs.bookmarks}
            nest={-1}
            inheritedPosition={[]}
          />
        ) : (
          <span className="drop-large-field">
            Drop a file here to create a bookmark
          </span>
        )}
      </div>
    );
  }
}
