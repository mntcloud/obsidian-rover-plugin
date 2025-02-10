import m from "mithril";

import { FileManagerSubView } from "./FileManager";
import { RecentsView } from "./RecentsView";
import { BookmarksView } from "./Bookmarks";

import { Bookmarks } from "view/models/BookmarksModel";


export class ContainerView implements m.ClassComponent {

	view(vnode: m.Vnode<Attr, this>) {
		return (
			<div class="rover">
				<BookmarksView bookmarks={Bookmarks.items} />	
				<RecentsView />
				<FileManagerSubView />
			</div>
		);
	}
}