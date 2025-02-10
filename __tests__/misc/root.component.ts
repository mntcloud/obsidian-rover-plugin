import m from "mithril"
import { ListBookmarks } from "view/components/Bookmarks/ListBookmarks"
import { Bookmarks } from "view/models/BookmarksModel"


export const Root = {
  view: function () {
    return m(ListBookmarks, {inheritedIndex: -1, items: Bookmarks.items, nest: -1})
  }
}