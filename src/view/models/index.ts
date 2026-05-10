import { RoverView } from "../RoverSidebarView";
import { BookmarksBaseModel } from "./BookmarksModel";
import { ExplorerBaseModel } from "./ExplorerModel";
import { RecentsBaseModel } from "./RecentsModel";

/**
 * It makes models accessible everywhere inside Mithril component tree
 * @param rover RoverView reference
 */
export function finishSetup(rover: RoverView) {
  Bookmarks = rover.bookmarks;
  Explorer = rover.explorer;
  Recents = rover.recents;
}

// Yes, it is a dirty hack to pass the type system.
// RoverView is created via constructor at startup once and models are setup in constructor,
// a way before Mithril `m.mount`, so it shouldn't create any problems (in theory)
export let Bookmarks: BookmarksBaseModel =
  undefined as unknown as BookmarksBaseModel;
export let Explorer: ExplorerBaseModel =
  undefined as unknown as ExplorerBaseModel;
export let Recents: RecentsBaseModel = undefined as unknown as RecentsBaseModel;
