import m from "mithril";
import * as utils from "utils";
import { Space } from "./Space";

import { Bookmarks } from "view/models/BookmarksModel";
import { Explorer } from "view/models/ExplorerModel";
import { Menu } from "obsidian";

interface Attr {
    position: number[];
    name: string;
    emojicon: string;
    path: string;
    nest: number;
}

export class BookmarkItem implements m.ClassComponent<Attr> {
    isDragStarted: boolean;
    isDragEntered: boolean;

    constructor(vnode: unknown) {
        this.isDragStarted = false;
        this.isDragEntered = false;
    }

    onDragEnterLeave(ev: DragEvent) {
        this.isDragEntered = !this.isDragEntered;

        return true;
    }

    onDragStart(ev: DragEvent, attrs: Attr, key: number) {
        Bookmarks.dragged = {
            pos: attrs.position,
        };

        ev.dataTransfer!.setData(
            "application/rover.bookmark",
            JSON.stringify({
                crd: key,
                name: attrs.name,
                emojicon: attrs.emojicon,
                path: attrs.path,
            }),
        );

        this.isDragStarted = true;
    }

    onDragEnd() {
        if (Bookmarks.dragged) {
            Bookmarks.dragged = undefined;
        }

        this.isDragStarted = false;

        // do not bubble
        return false;
    }

    handleContextMenu(ev: MouseEvent, attr: Attr) {
        const menu = new Menu();

        menu.addItem((item) =>
            item
                .setTitle("Edit...")
                .setIcon("pen-line")
                .onClick(() => {
                    Bookmarks.openModifyItemModal(
                        attr.name,
                        attr.emojicon,
                        attr.position,
                        attr.path,
                    );
                })
        );

        menu.addItem((item) =>
            item
                .setTitle("Delete")
                .setIcon("trash")
                .onClick(() => {
                    Bookmarks.delete(attr.position);

                    Bookmarks.save();

                    m.redraw();
                })
        );

        menu.showAtMouseEvent(ev);
    }

    onDrop(ev: DragEvent, attr: Attr) {
        if (!ev.dataTransfer) {
            utils.error("BOOKMARK_ITEM: data transfer is undefined...");
            return;
        }

        switch (true) {
            case ev.dataTransfer.types.includes("application/rover.bookmark"): {
                Bookmarks.openCreateFolderModal(attr.position);
                break;
            }
            case ev.dataTransfer.types.includes("application/rover.file"): {
                const path = ev.dataTransfer.getData("application/rover.file");

                Bookmarks.openModifyItemModal(
                    attr.name,
                    attr.emojicon,
                    attr.position,
                    path,
                );
                break;
            }
            default:
                break;
        }
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <>
                {Bookmarks.dragged && (
                        (Bookmarks.dragged.pos.length >
                                vnode.attrs.position.length &&
                            Bookmarks.dragged
                                    .pos[vnode.attrs.position.length - 1] >
                                vnode.attrs
                                    .position[
                                        vnode.attrs.position.length - 1
                                    ]) ||
                        (Bookmarks.dragged.pos.length <=
                                vnode.attrs.position.length &&
                            Bookmarks.dragged
                                    .pos[Bookmarks.dragged.pos.length - 1] >
                                vnode.attrs
                                    .position[Bookmarks.dragged.pos.length - 1])
                    )
                    ? (
                        <Space
                            crd={vnode.key}
                            position={vnode.attrs.position}
                            noHighlight={this.isDragStarted}
                            nest={vnode.attrs.nest}
                        />
                    )
                    : null}
                <div
                    className={`rover-bookmark-item ${
                        this.isDragEntered ? "hovered" : ""
                    }`}
                    style={`margin-left: calc(8px * ${vnode.attrs.nest})`}
                    draggable={true}
                    data-crd={vnode.key}
                    oncontextmenu={(ev: MouseEvent) =>
                        this.handleContextMenu(ev, vnode.attrs)}
                    onclick={() => Explorer.openFile(vnode.attrs.path)}
                    ondragenter={(ev: DragEvent) => this.onDragEnterLeave(ev)}
                    ondragleave={(ev: DragEvent) => this.onDragEnterLeave(ev)}
                    ondragstart={(ev: DragEvent) =>
                        this.onDragStart(ev, vnode.attrs, vnode.key as number)}
                    ondragend={() => this.onDragEnd()}
                    ondrop={!this.isDragStarted
                        ? (ev: DragEvent) => this.onDrop(ev, vnode.attrs)
                        : undefined}
                    ondragover={!this.isDragStarted
                        ? (ev: DragEvent) => ev.preventDefault()
                        : undefined}
                >
                    <span className="rover-emojicon">
                        {vnode.attrs.emojicon}
                    </span>
                    {vnode.attrs.name}
                </div>
                {Bookmarks.dragged && (
                        (Bookmarks.dragged.pos.length >
                                vnode.attrs.position.length &&
                            Bookmarks.dragged
                                    .pos[vnode.attrs.position.length - 1] <
                                vnode.attrs
                                    .position[
                                        vnode.attrs.position.length - 1
                                    ]) ||
                        (Bookmarks.dragged.pos.length <=
                                vnode.attrs.position.length &&
                            Bookmarks.dragged
                                    .pos[Bookmarks.dragged.pos.length - 1] <
                                vnode.attrs
                                    .position[Bookmarks.dragged.pos.length - 1])
                    )
                    ? (
                        <Space
                            crd={vnode.key}
                            position={vnode.attrs.position.map((val, index) =>
                                index == vnode.attrs.position.length - 1
                                    ? val + 1
                                    : val
                            )}
                            noHighlight={this.isDragStarted}
                            nest={vnode.attrs.nest}
                        />
                    )
                    : null}
            </>
        );
    }
}
