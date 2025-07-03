import m from "mithril"
import { ListBookmarks } from "view/components/Bookmarks/ListBookmarks"
import { Bookmarks } from "view/models/BookmarksModel"


export const Root = {
  view: function () {
    return m(ListBookmarks, {inheritedPosition: [], items: Bookmarks.items, nest: -1})
  }
}