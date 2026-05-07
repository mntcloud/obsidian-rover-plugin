// this file is full of sideffects

import { ModifyItemModal } from "rover/modals/bookmarks/ModifyItem";
import { BookmarksBaseModel } from "./BookmarksModel";
import { Obsidian } from "./Obsidian";
import { ExplorerBaseModel } from "./ExplorerModel";
import { RecentsBaseModel } from "./RecentsModel";
import { CreateItemModal } from "rover/modals/bookmarks/CreateItem";
import { CreateFolderModal } from "rover/modals/bookmarks/CreateFolder";

export const Bookmarks = new BookmarksBaseModel(Obsidian);

export const Recents = new RecentsBaseModel(Obsidian);

export const Explorer = new ExplorerBaseModel(Obsidian, Recents);
