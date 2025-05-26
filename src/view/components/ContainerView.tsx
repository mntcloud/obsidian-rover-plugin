import m from "mithril";

import { ExplorerView } from "./ExplorerView";
import { RecentsView } from "./RecentsView";
import { BookmarksView } from "./BookmarksView";

import { Bookmarks } from "view/models/BookmarksModel";


export class ContainerView implements m.ClassComponent {
	view(vnode: m.Vnode<Attr, this>) {
		return (
			<div class="rover">
				<BookmarksView bookmarks={Bookmarks.items} />	
				<RecentsView />
				<ExplorerView />
			</div>
		);
	}
}