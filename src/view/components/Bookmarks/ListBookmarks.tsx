import m from "mithril"
import { BookmarkFolder } from "./BookmarkFolder"
import { BookmarkItem } from "./BookmarkItem"
import { RoverBookmark } from "view/models/data/Base"


interface Attr {
    inheritedPosition: number[],
    items: RoverBookmark[],
    nest: number
}

export class ListBookmarks implements m.ClassComponent<Attr> { 
    view(vnode: m.Vnode<Attr, this>) {
        return <>
            {vnode.attrs.items.map((bookmark, index) => {
                if (bookmark.children) {
                    return (
                        <BookmarkFolder
                            key={bookmark.crd} 
                            position={vnode.attrs.inheritedPosition.concat(index)} 
                            name={bookmark.name} emojicon={bookmark.emojicon}
                            bookmarks={bookmark.children} nest={vnode.attrs.nest + 1} />
                    )
                } else {
                    return (
                        <BookmarkItem
                            path={bookmark.path}
                            position={vnode.attrs.inheritedPosition.concat(index)}
                            key={bookmark.crd} nest={vnode.attrs.nest + 1}
                            name={bookmark.name} emojicon={bookmark.emojicon} />
                    )
                }
            })}
        </>
    }
}