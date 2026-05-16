import m from "mithril";

import { Menu } from "obsidian";
import { Bookmarks, Explorer } from "rover/view/models";

interface Attr {
  name: string;
  path: string;
  nest: number;
}

export class File implements m.ClassComponent<Attr> {
  renameFieldText?: string;
  isEdited: boolean = false;

  handleInputChange(ev: Event) {
    const target = ev.target as HTMLInputElement;

    this.renameFieldText = target.value;
  }

  async handleEnterKey(ev: KeyboardEvent, path: string) {
    if (ev.code == "Enter") {
      await Explorer.renameFile(path, this.renameFieldText!);

      this.isEdited = false;
      this.renameFieldText = undefined;
    }

    if (ev.code == "Escape") {
      this.isEdited = false;
      this.renameFieldText = undefined;
    }

    m.redraw();
  }

  onupdate(vnode: m.VnodeDOM<Attr, this>) {
    if (this.isEdited) {
      const input = vnode.dom.querySelector("input")!;

      input?.focus({ preventScroll: true });
    }
  }

  handleContextMenu(ev: PointerEvent, path: string) {
    const menu = new Menu();
    const file = Explorer.retrieve("file", path)!;

    menu.addItem((item) =>
      item
        .setTitle("Make a copy")
        .setIcon("documents")
        .setSection("action-primary")
        .onClick(async () => {
          await Explorer.copyFile(file);
        }),
    );

    menu.addItem((item) =>
      item
        .setTitle("Rename...")
        .setIcon("pen-line")
        .setSection("action-primary")
        .onClick(() => {
          this.renameFieldText = file.basename;
          this.isEdited = true;

          m.redraw();
        }),
    );

    if (file) {
      Explorer.rover!.app.workspace.trigger(
        "file-menu",
        menu,
        file,
        "file-explorer-context-menu",
      );
    }

    menu.addItem((item) =>
      item
        .setTitle("Delete")
        .setIcon("trash")
        .setSection("danger")
        .onClick(async () => {
          await Explorer.delete(file);
        }),
    );

    menu.showAtMouseEvent(ev);

    return false;
  }

  onDragStart(ev: DragEvent, path: string) {
    Bookmarks.isFileDragStarted = true;

    ev.dataTransfer!.setData("application/rover.file", path);
  }

  onDragEnd(ev: DragEvent) {
    Bookmarks.isFileDragStarted = false;
  }

  view(vnode: m.Vnode<Attr, this>) {
    return (
      <div
        className="rover-file"
        style={`margin-left: calc(10px * ${vnode.attrs.nest})`}
        draggable={true}
        ondragstart={(ev: DragEvent) => this.onDragStart(ev, vnode.attrs.path)}
        ondragend={(ev: DragEvent) => this.onDragEnd(ev)}
        oncontextmenu={(ev: PointerEvent) =>
          this.handleContextMenu(ev, vnode.attrs.path)
        }
        onclick={
          !this.isEdited ? () => Explorer.openFile(vnode.attrs.path) : undefined
        }
      >
        {!this.isEdited ? (
          <span>
            {!this.renameFieldText ? vnode.attrs.name : this.renameFieldText}
          </span>
        ) : (
          <input
            value={this.renameFieldText}
            oninput={(ev: Event) => this.handleInputChange(ev)}
            onkeydown={async (ev: KeyboardEvent) =>
              await this.handleEnterKey(ev, vnode.attrs.path)
            }
          />
        )}
      </div>
    );
  }
}
