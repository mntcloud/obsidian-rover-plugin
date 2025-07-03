import m from "mithril";

import { ExplorerView } from "./ExplorerView";
import { RecentsView } from "./RecentsView";
import { BookmarksView } from "./BookmarksView";

import { Bookmarks } from "view/models/BookmarksModel";


export class ContainerView implements m.ClassComponent {
	onDragStart(ev: DragEvent) {
		if (ev.dataTransfer) {
			switch (ev.dataTransfer.types[0]) {
				case "application/rover.file":
					Bookmarks.dragged = {
						pos: [-1]			
					}
			}

		}
	}

	onDragEnd(ev: DragEvent) {
		if (ev.dataTransfer) {
			Bookmarks.dragged = undefined
		}
	}

	view(vnode: m.Vnode<Attr, this>) {
		return (
			<div class="rover" ondragend={this.onDragEnd} ondragstart={this.onDragStart}>
				<BookmarksView bookmarks={Bookmarks.items} />	
				<RecentsView />
				<ExplorerView />
			</div>
		);
	}
}