/**
 * @jest-environment jsdom
 */

import m from "mithril"

import { Bookmarks } from "view/models/BookmarksModel"
import { Root } from "../misc/root.component"

describe('BookmarksFolder', () => {
  beforeAll(() => {
    document.body.innerHTML =
      `<div id="root">
       </div>`
  })

  test("test ondrop event", () => {
    Bookmarks.items = [
      {
        "crd": 1737555158000,
        "name": "deadmonger",
        "emojicon": "😶‍🌫️",
        "path": "_nofilter/22 January '25.md"
      },
      {
        "crd": 1737555153004,
        "name": "Мысли",
        "emojicon": "🫠",
        "path": "_nofilter/22 January '25.md"
      },
      {
        "name": "wlo",
        "emojicon": "📁",
        "crd": 1737646933172,
        "children": [
          {
            "crd": 1737554144200,
            "name": "lom",
            "emojicon": "👽",
            "path": "_nofilter/22 January '25.md"
          },
          {
            "crd": 1738004363439,
            "name": "lol",
            "emojicon": "🧑‍💻",
            "path": "_nofilter/27 January '25 ~ 2.md"
          }
        ]
      }
    ]

    const root = document.getElementById("root")!

    m.render(root, m(Root))

    Bookmarks.dragged = [1]

    const item = root.querySelector(`.rover-bookmark-folder[data-crd="1737646933172"]`)!
    const event = new Event("drop", { bubbles: true })

    item.dispatchEvent(event)
    m.render(root, m(Root))

    expect(Bookmarks.items[1].children).toBeTruthy()
    expect(Bookmarks.items[1].children![0].crd).toEqual(1737555153004)
  })

  test("test reveal on click", () => {
    Bookmarks.items = [
      {
        "name": "wlo",
        "emojicon": "📁",
        "crd": 1737646933172,
        "children": [
          {
            "crd": 1737554144200,
            "name": "lom",
            "emojicon": "👽",
            "path": "_nofilter/22 January '25.md"
          },
          {
            "crd": 1738004363439,
            "name": "lol",
            "emojicon": "🧑‍💻",
            "path": "_nofilter/27 January '25 ~ 2.md"
          }
        ]
      }
    ]

    const root = document.getElementById("root")!

    m.render(root, m(Root))

    Bookmarks.dragged = [1]

    const folder = root.querySelector(`.rover-bookmark-folder[data-crd="1737646933172"]`)!
    const event = new Event("click", { bubbles: true })

    folder.dispatchEvent(event)
    m.render(root, m(Root))

    const item = root.querySelector(`.rover-bookmark-item[data-crd="1737554144200"]`)

    expect(item).toBeTruthy()
  })
})
