// this file is full of sideffects

import { BookmarksBaseModel } from "./BookmarksModel";
import { Obsidian } from "./Obsidian";
import { ExplorerBaseModel } from "./ExplorerModel";
import { RecentsBaseModel } from "./RecentsModel";

export const Bookmarks = new BookmarksBaseModel(Obsidian);
export const Recents = new RecentsBaseModel(Obsidian);
export const Explorer = new ExplorerBaseModel(Obsidian, Recents);
