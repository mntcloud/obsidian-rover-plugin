// this file is full of sideffects

import { ModifyItemModal } from "rover/modals/bookmarks/ModifyItem";
import { BookmarksBaseModel } from "./BookmarksModel";
import { Obsidian } from "./app";
import { ExplorerBaseModel } from "./ExplorerModel";
import { RecentsBaseModel } from "./RecentsModel";
import { CreateItemModal } from "rover/modals/bookmarks/CreateItem";
import { CreateFolderModal } from "rover/modals/bookmarks/CreateFolder";

export const Bookmarks = new BookmarksBaseModel(Obsidian, (type, args) => {
  if (type == "modifyItem" && "name" in args) {
    return new ModifyItemModal(
      Obsidian!.app,
      args.name,
      args.emoji,
      args.onFinish,
      args.path,
    ).open();
  }

  if (type == "createItem" && "path" in args) {
    return new CreateItemModal(Obsidian!.app, args.path!, args.onFinish);
  }

  return new CreateFolderModal(
    Obsidian!.app,
    args.onFinish as (name: string, emoji: string) => void,
  );
});

export const Recents = new RecentsBaseModel(Obsidian);

export const Explorer = new ExplorerBaseModel(Obsidian, Recents);
