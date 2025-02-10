import m from "mithril"
import { BookmarkFolder } from "./BookmarkFolder"
import { BookmarkItem } from "./BookmarkItem"
import { RoverBookmark } from "view/models/data/Base"


interface Attr {
    inheritedIndex: number,
    items: RoverBookmark[],
    nest: number
}

export class ListBookmarks implements m.ClassComponent<Attr> {
    count(items: RoverBookmark[], inherited: number) {
        let flattened = inherited
        let index = 0

        while (index != items.length) {
            const item = items[index]

            if (item.children) {
                flattened = this.count(item.children, flattened)
            } else {
                flattened++
            }

            index++
        }

        return flattened
    }

    view(vnode: m.Vnode<Attr, this>) {
        let flattened = vnode.attrs.inheritedIndex

        return <>
            {vnode.attrs.items.map((bookmark, index) => {
                if (bookmark.children) {
                    const flattenedIndex = flattened + 1

                    flattened = this.count(bookmark.children, flattened + 1) + 1

                    return (
                        <BookmarkFolder
                            flattenedIndex={flattenedIndex}
                            key={bookmark.crd} index={index}
                            name={bookmark.name} emojicon={bookmark.emojicon}
                            bookmarks={bookmark.children} nest={vnode.attrs.nest + 1} />
                    )
                } else {
                    const flattenedIndex = flattened
                    flattened++

                    return (
                        <BookmarkItem
                            path={bookmark.path}
                            flattenedIndex={flattenedIndex}
                            index={index} key={bookmark.crd} nest={vnode.attrs.nest + 1}
                            name={bookmark.name} emojicon={bookmark.emojicon} />
                    )
                }
            })}
        </>
    }
}