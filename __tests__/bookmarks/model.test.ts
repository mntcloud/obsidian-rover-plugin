import { describe, expect, test } from "@jest/globals";
import { Bookmarks } from "view/models/BookmarksModel";
import { RoverBookmark } from "view/models/data/Base";

const item = (name: string, path?: string, children?: RoverBookmark[]) => ({
  name,
  crd: 0,
  emojicon: "🫠",
  path,
  children
});

describe("Bookmarks Model", () => {
  describe("move", () => {
    test("move bookmark: basic", () => {
      Bookmarks.items = [
        item("deadmonger", undefined, [
          item("Мысли", "_nofilter/22 January '25.md"),
          item("lol", undefined, [
            item("lol2", "_nofilter/27 January '25 ~ 2.md")
          ])
        ])
      ];
      Bookmarks.dragged = {
        pos: [0, 0]
      };
      Bookmarks.move([0, 1, 1], item("Мысли", "_nofilter/22 January '25.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("deadmonger", undefined, [
          item("lol", undefined, [
            item("lol2", "_nofilter/27 January '25 ~ 2.md"),
            item("Мысли", "_nofilter/22 January '25.md"),
          ])
        ])
      ]);
    });

    test("move bookmark: move item from second level to first, place it lower than parent", () => {
      Bookmarks.items = [
        item("проектики", undefined, [
          item("сторонние", undefined, [
            item("Project Ada", "Разработка/12 июня '25.md"),
            item("o", "Разработка/o/задачи/СТАТУС.canvas"),
            item("weekl", "Разработка/Проекты/weekl/laika1.stage1.track.md")
          ]),
          item("rover", "Разработка/rover/задачи/СТАТУС.canvas")
        ]),
        item("LACIA", "Исследования/LACIA.md"),
        item("Для чего еще можно использовать LLM?", "Исследования/04 июня '25 ~ 2.md"),
        item("Что может мне вернуть интерес", "_nofilter/04 июня '25.md")
      ];
      Bookmarks.dragged = {
        pos: [0, 1]
      };
      Bookmarks.move([3], item("rover", "Разработка/rover/задачи/СТАТУС.canvas"));
      expect(Bookmarks.items).toStrictEqual([
        item("проектики", undefined, [
          item("сторонние", undefined, [
            item("Project Ada", "Разработка/12 июня '25.md"),
            item("o", "Разработка/o/задачи/СТАТУС.canvas"),
            item("weekl", "Разработка/Проекты/weekl/laika1.stage1.track.md")
          ])
        ]),
        item("LACIA", "Исследования/LACIA.md"),
        item("Для чего еще можно использовать LLM?", "Исследования/04 июня '25 ~ 2.md"),
        item("rover", "Разработка/rover/задачи/СТАТУС.canvas"),
        item("Что может мне вернуть интерес", "_nofilter/04 июня '25.md")
      ]);
    });

    test("move bookmark: place item outside of it's parent", () => {
      Bookmarks.items = [
        item("проектики", undefined, [
          item("сторонние", undefined, [
            item("Project Ada", "Разработка/12 июня '25.md"),
            item("o", "Разработка/o/задачи/СТАТУС.canvas"),
            item("weekl", "Разработка/Проекты/weekl/laika1.stage1.track.md")
          ]),
          item("rover", "Разработка/rover/задачи/СТАТУС.canvas")
        ]),
        item("LACIA", "Исследования/LACIA.md"),
        item("Для чего еще можно использовать LLM?", "Исследования/04 июня '25 ~ 2.md"),
        item("Что может мне вернуть интерес", "_nofilter/04 июня '25.md")
      ];
      Bookmarks.dragged = {
        pos: [0, 0, 1]
      };
      Bookmarks.move([0, 0], item("o", "Разработка/o/задачи/СТАТУС.canvas"));
      expect(Bookmarks.items).toStrictEqual([
        item("проектики", undefined, [
          item("o", "Разработка/o/задачи/СТАТУС.canvas"),
          item("сторонние", undefined, [
            item("Project Ada", "Разработка/12 июня '25.md"),
            item("weekl", "Разработка/Проекты/weekl/laika1.stage1.track.md")
          ]),
          item("rover", "Разработка/rover/задачи/СТАТУС.canvas")
        ]),
        item("LACIA", "Исследования/LACIA.md"),
        item("Для чего еще можно использовать LLM?", "Исследования/04 июня '25 ~ 2.md"),
        item("Что может мне вернуть интерес", "_nofilter/04 июня '25.md")
      ]);
    });

    test("move bookmark: nested to nested", () => {
      Bookmarks.items = [
        item("A", undefined, [
          item("B", undefined, [
            item("C", "C.md")
          ]),
          item("D", undefined, [])
        ])
      ];
      Bookmarks.dragged = {
        pos: [0, 0, 0]
      };
      Bookmarks.move([0, 1, 0], item("C", "C.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, [
          item("B", undefined, []),
          item("D", undefined, [
            item("C", "C.md")
          ])
        ])
      ]);
    });

    test("move bookmark: root to nested", () => {
      Bookmarks.items = [
        item("A", undefined, []),
        item("B", undefined, [])
      ];
      Bookmarks.dragged = {
        pos: [1]
      };
      Bookmarks.move([0, 0], item("B", undefined, []));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, [
          item("B", undefined, [])
        ])
      ]);
    });

    test("move bookmark: nested to root", () => {
      Bookmarks.items = [
        item("A", undefined, [
          item("B", "B.md")
        ]),
        item("C", "C.md")
      ];
      Bookmarks.dragged = {
        pos: [0, 0]
      };
      Bookmarks.move([1], item("B", "B.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, []),
        item("B", "B.md"),
        item("C", "C.md")
      ]);
    });

    test("move bookmark: simple two items reorder within same folder", () => {
      Bookmarks.items = [
        item("A", undefined, [
          item("B", "B.md"),
          item("C", "C.md")
        ])
      ];
      Bookmarks.dragged = {
        pos: [0, 0]
      };
      Bookmarks.move([0, 2], item("B", "B.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, [
          item("C", "C.md"),
          item("B", "B.md")
        ])
      ]);
    });

    test("move bookmark: to empty folder", () => {
      Bookmarks.items = [
        item("A", undefined, []),
        item("B", "B.md")
      ];
      Bookmarks.dragged = {
        pos: [1]
      };
      Bookmarks.move([0, 0], item("B", "B.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, [
          item("B", "B.md")
        ])
      ]);
    });

    test("move bookmark: destination is source (no change)", () => {
      Bookmarks.items = [
        item("A", undefined, [
          item("B", "B.md")
        ])
      ];
      Bookmarks.dragged = {
        pos: [0, 0]
      };
      Bookmarks.move([0, 0], item("B", "B.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, [
          item("B", "B.md")
        ])
      ]);
    });

    test("move bookmark: test a condition, when we put the item up", () => {
      Bookmarks.items = [
        item("A", undefined, []),
        item("B", "B.md"),
        item("C", "C.md"),
        item("D", "D.md")
      ];
      Bookmarks.dragged = {
        pos: [2]
      };
      Bookmarks.move([1], item("C", "C.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, []),
        item("C", "C.md"), 
        item("B", "B.md"), 
        item("D", "D.md")
      ]);
    });

    test("move bookmark: test an opposite condition, when we put the item down", () => {
      Bookmarks.items = [
        item("A", undefined, []),
        item("B", "B.md"),
        item("C", "C.md"),
        item("D", "D.md")
      ];
      Bookmarks.dragged = {
        pos: [2]
      };
      Bookmarks.move([4], item("C", "C.md"));
      expect(Bookmarks.items).toStrictEqual([
        item("A", undefined, []), 
        item("B", "B.md"), 
        item("D", "D.md"),
        item("C", "C.md"), 
      ]);
    });
  });

  describe("find", () => {
    test("finds item by path at root", () => {
      Bookmarks.items = [
        item("A", "A.md"),
        item("B", "B.md")
      ];
      expect(Bookmarks.find("A.md")).toEqual(item("A", "A.md"));
      expect(Bookmarks.find("B.md")).toEqual(item("B", "B.md"));
    });

    test("finds item by path in nested children", () => {
      Bookmarks.items = [
        item("A", undefined, [
          item("B", "B.md"),
          item("C", undefined, [
            item("D", "D.md")
          ])
        ])
      ];
      expect(Bookmarks.find("B.md")).toEqual(item("B", "B.md"));
      expect(Bookmarks.find("D.md")).toEqual(item("D", "D.md"));
    });

    test("returns null if path not found", () => {
      Bookmarks.items = [
        item("A", "A.md"),
        item("B", undefined, [
          item("C", "C.md")
        ])
      ];
      expect(Bookmarks.find("notfound.md")).toBeNull();
    });

    test("finds deeply nested item", () => {
      Bookmarks.items = [
        item("root", undefined, [
          item("level1", undefined, [
            item("level2", undefined, [
              item("target", "target.md")
            ])
          ])
        ])
      ];
      expect(Bookmarks.find("target.md")).toEqual(item("target", "target.md"));
    });
  });
});
