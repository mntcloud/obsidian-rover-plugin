import m from "mithril";

import { ListBookmarks } from "./ListBookmarks";
import { RoverBookmark } from "view/models/data/Base";
import { Bookmarks } from "view/models/BookmarksModel";
import { Space } from "./Space";
import { Menu } from "obsidian";

interface Attr {
    position: number[];
    name: string;
    emojicon: string;
    bookmarks: RoverBookmark[];
    nest: number;
}

export class BookmarkFolder implements m.ClassComponent<Attr> {
    isDragStarted: boolean;
    isCollapsed = true;

    timeoutID?: NodeJS.Timeout 
    
    oninit(vnode: m.Vnode<Attr, this>) {
        this.isCollapsed = !Bookmarks.isTesting;
    }

    onDragEnter() {
        this.timeoutID = setTimeout(() => {
            this.isCollapsed = !this.isCollapsed
            m.redraw()
        }, 1500);

        return true
    }

    onDragExit() {
        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
        }

        return true
    }

    onMenu(ev: MouseEvent, attr: Attr) {
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

    onDragStart(ev: DragEvent, attrs: Attr, key: number) {
        // NOTE: This share the same behaviour with the BookmarkItem's dragstart
        ev.dataTransfer!.setData(
            "application/rover.bookmark",
            JSON.stringify({
                crd: key,
                name: attrs.name,
                emojicon: attrs.emojicon,
                children: attrs.bookmarks,
            }),
        );

        Bookmarks.dragged = {
            pos: attrs.position,
        };

        this.isDragStarted = true;
    }

    onDrop(ev: DragEvent, attr: Attr) {
        if (ev.dataTransfer?.types.includes("application/rover.bookmark")) {
            const item = JSON.parse(
                ev.dataTransfer.getData("application/rover.bookmark"),
            ) as RoverBookmark;

            // Move to the top position
            Bookmarks.move(attr.position.concat(0), item);

            Bookmarks.save();
            m.redraw();
        }
    }

    onDragEnd() {
        this.isDragStarted = false;

        // do not bubble
        return false;
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div
                className="rover-bookmark-folder-container"
                data-crd={vnode.key}
            >
                {Bookmarks.dragged && (
                        (Bookmarks.dragged.pos.length >
                                vnode.attrs.position.length &&
                            Bookmarks.dragged
                                    .pos[vnode.attrs.position.length - 1] >=
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
                    className={`rover-bookmark-folder ${
                        !this.isCollapsed ? "open" : ""
                    }`}
                    style={`margin-left: calc(8px * ${vnode.attrs.nest})`}
                    draggable={true}
                    data-crd={vnode.key}
                    oncontextmenu={(ev: MouseEvent) =>
                        this.onMenu(ev, vnode.attrs)}
                    ondragenter={() => this.onDragEnter()}
                    ondragleave={() => this.onDragExit()}
                    ondrop={(ev: DragEvent) => this.onDrop(ev, vnode.attrs)}
                    ondragstart={(ev: DragEvent) =>
                        this.onDragStart(ev, vnode.attrs, vnode.key as number)}
                    ondragover={(ev: DragEvent) => ev.preventDefault()}
                    ondragend={() => this.onDragEnd()}
                    onclick={() => {
                        this.isCollapsed = !this.isCollapsed;
                    }}
                >
                    <span className="rover-emojicon">
                        {vnode.attrs.emojicon}
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="rover-lucide lucide-chevron-right"
                    >
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                    {vnode.attrs.name}
                </div>

                {!this.isCollapsed
                    ? (
                        <ListBookmarks
                            inheritedPosition={vnode.attrs.position}
                            items={vnode.attrs.bookmarks}
                            nest={vnode.attrs.nest}
                        />
                    )
                    : null}

                {Bookmarks.dragged && (
                        (Bookmarks.dragged.pos.length >
                                vnode.attrs.position.length &&
                            Bookmarks.dragged
                                    .pos[vnode.attrs.position.length - 1] <=
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
            </div>
        );
    }
}
