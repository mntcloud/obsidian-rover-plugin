import m from "mithril";
import { logError } from "rover/helpers";
import { Bookmarks } from "rover/view/models";
import { RoverBookmark } from "rover/core";

interface Attr {
  position: number[];
  nest: number;
  noHighlight: boolean;
  crd: number;
}

// Highlight free space in between bookmarks
export class Space implements m.ClassComponent<Attr> {
  isActive: boolean;

  constructor(vnode: unknown) {
    this.isActive = false;
  }

  onEnterOrLeave(attr: Attr) {
    if (!attr.noHighlight) {
      this.isActive = !this.isActive;
    }

    return false;
  }

  onDrop(ev: DragEvent, attr: Attr) {
    if (!ev.dataTransfer) {
      logError("Data transfer: undefined");
      return;
    }

    if (ev.dataTransfer.types.includes("application/rover.bookmark")) {
      const item = JSON.parse(
        ev.dataTransfer.getData("application/rover.bookmark"),
      ) as RoverBookmark;

      Bookmarks.move(attr.position, item);

      Bookmarks.save();
    }

    if (ev.dataTransfer.types.includes("application/rover.file")) {
      const path = ev.dataTransfer.getData("application/rover.file");

      Bookmarks.openModal("createItem", { pos: attr.position, path });
    }
  }

  view(vnode: m.Vnode<Attr, this>): m.Children {
    return (
      <div
        className={`rover-space ${this.isActive ? "active" : ""}`}
        style={`margin-left: calc(4px * ${vnode.attrs.nest})`}
        data-crd={vnode.attrs.crd}
        ondragleave={() => this.onEnterOrLeave(vnode.attrs)}
        ondragenter={() => this.onEnterOrLeave(vnode.attrs)}
        ondragover={
          !vnode.attrs.noHighlight
            ? (ev: DragEvent) => ev.preventDefault()
            : () => false
        }
        ondrop={
          !vnode.attrs.noHighlight
            ? (ev: DragEvent) => this.onDrop(ev, vnode.attrs)
            : () => false
        }
      />
    );
  }
}
