/* eslint-disable @typescript-eslint/prefer-for-of */

import m from "mithril";
import { EventRef } from "obsidian";
import { log } from "rover/utils";

import { Bookmarks, Explorer, Recents } from "rover/view/models";
import { Obsidian } from "rover/view/models/Obsidian";

export class RecentsView implements m.ClassComponent {
  onDragStart(ev: DragEvent, path: string) {
    Bookmarks.isFileDragStarted = true;

    ev.dataTransfer!.setData("application/rover.file", path);
  }

  onDragEnd() {
    Bookmarks.isFileDragStarted = false;
  }

  oncreate(vnode: m.VnodeDOM<{}, this>) {
    Recents.attachListeners();
    Recents.update();
    m.redraw();
  }

  onremove(vnode: m.VnodeDOM<{}, this>) {
    Recents.detachListeners();
  }

  view(_vnode: m.Vnode<{}, this>) {
    return (
      <div className="rover-container rover-recents">
        <div
          className="rover-file active"
          draggable={true}
          ondragstart={(ev: DragEvent) =>
            Recents.active
              ? this.onDragStart(ev, Recents.active.path)
              : log("no can't do with empty file")
          }
          ondragend={this.onDragEnd}
        >
          {Recents.active ? Recents.active.basename : "No active file"}
        </div>

        <div className="rover-recents-others">
          {Recents.previous.length ? (
            Recents.previous.map((path) => {
              return (
                <div
                  className="rover-file"
                  draggable={true}
                  onclick={() => Explorer.openFile(path.full, true)}
                  ondragend={this.onDragEnd}
                  ondragstart={(ev: DragEvent) =>
                    this.onDragStart(ev, path.full)
                  }
                >
                  {`${path.parentPath ? path.parentPath + "/" : ""}${path.name}`}
                </div>
              );
            })
          ) : (
            <span>No recents files yet</span>
          )}
        </div>
      </div>
    );
  }
}
