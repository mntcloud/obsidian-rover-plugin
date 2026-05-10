import m from "mithril";

import { EventRef, ItemView, Vault, Workspace, WorkspaceLeaf } from "obsidian";
import { ContainerView } from "./components/ContainerView";
import { RoverPluginSettings } from "rover/core";
import { BookmarksBaseModel } from "./models/BookmarksModel";
import { RecentsBaseModel } from "./models/RecentsModel";
import { ExplorerBaseModel } from "./models/ExplorerModel";
import { finishSetup } from "./models";
import { log } from "rover/helpers";

export const VIEW_TYPE = "rover-view";

type ObsidianEventRegistry =
  | PrefixedEventEntry<"vault:", Vault["on"]>
  | PrefixedEventEntry<"workspace:", Workspace["on"]>;

export class RoverView extends ItemView {
  private subs: Map<
    ObsidianEventRegistry["event"],
    {
      evref: EventRef;
      handlers: Function[];
    }
  > = new Map();

  bookmarks: BookmarksBaseModel;
  recents: RecentsBaseModel;
  explorer: ExplorerBaseModel;

  constructor(
    leaf: WorkspaceLeaf,
    public settings: RoverPluginSettings,
    public save: (settings: RoverPluginSettings) => void,
  ) {
    super(leaf);

    this.icon = "bot";
    this.navigation = false;

    this.bookmarks = new BookmarksBaseModel(this, settings.bookmarks);
    this.recents = new RecentsBaseModel(this, settings.recents);
    this.explorer = new ExplorerBaseModel(this);

    finishSetup(this);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Rover";
  }

  subscribe<E extends ObsidianEventRegistry["event"]>(
    event: E,
    handler: Extract<ObsidianEventRegistry, { event: E }>["callback"],
  ): void {
    const sub = this.subs.get(event);

    if (!sub) {
      const colonAt = event.indexOf(":");
      const prefix = event.slice(0, colonAt);
      const name = event.slice(colonAt + 1);

      let evref: EventRef | null = null;

      switch (prefix) {
        case "vault":
          evref = this.app.vault.on(name as any, (...args: unknown[]) =>
            this.process(event, args),
          );
          break;
        case "workspace":
          evref = this.app.workspace.on(name as any, (...args: unknown[]) =>
            this.process(event, args),
          );
          break;
      }

      this.subs.set(event, {
        evref: evref!,
        handlers: [handler],
      });
    } else {
      sub.handlers.push(handler);
    }
  }

  async onOpen() {
    const container = this.containerEl;

    container.empty();

    m.mount(container, ContainerView);
  }

  async onClose() {
    const container = this.containerEl;

    // unmount
    m.mount(container, null);
    this.unsubscribeAll();
  }

  async process(event: ObsidianEventRegistry["event"], args: unknown[]) {
    const sub = this.subs.get(event);

    log(event, args);

    for (const handler of sub!.handlers) {
      const returned = handler(...args);

      if (returned instanceof Promise) {
        await returned;
      }
    }

    m.redraw();
  }

  unsubscribeAll() {
    for (const [event, sub] of this.subs) {
      const colonAt = event.indexOf(":");
      const prefix = event.slice(0, colonAt);
      const name = event.slice(colonAt + 1);

      switch (prefix) {
        case "vault":
          this.app.vault.offref(sub.evref);
          break;
        case "workspace":
          this.app.workspace.offref(sub.evref);
          break;
      }
    }
  }
}

// Hack to extract event names, so when I need to attach to any other event
// I don't need to extract a new event from obsidian.d and insert in code everytime
// looks like there is a the biggest number of events
// that can be registered for one Object is 16

type PrefixedEventEntry<
  Prefix extends string,
  T extends (...args: any[]) => any,
> =
  // Distribute: pull each [Name, Callback] pair out of the union one at a time
  OverloadPairs<T> extends infer Pair
    ? Pair extends [infer Name extends string, infer Callback]
      ? { event: `${Prefix}${Name}`; callback: Callback }
      : never
    : never;

type OverloadPairs<T extends (...args: any[]) => any> = T extends {
  (...args: [infer N1, infer C1, ...any[]]): any;
  (...args: [infer N2, infer C2, ...any[]]): any;
  (...args: [infer N3, infer C3, ...any[]]): any;
  (...args: [infer N4, infer C4, ...any[]]): any;
  (...args: [infer N5, infer C5, ...any[]]): any;
  (...args: [infer N6, infer C6, ...any[]]): any;
  (...args: [infer N7, infer C7, ...any[]]): any;
  (...args: [infer N8, infer C8, ...any[]]): any;
  (...args: [infer N9, infer C9, ...any[]]): any;
  (...args: [infer N10, infer C10, ...any[]]): any;
  (...args: [infer N11, infer C11, ...any[]]): any;
  (...args: [infer N12, infer C12, ...any[]]): any;
  (...args: [infer N13, infer C13, ...any[]]): any;
  (...args: [infer N14, infer C14, ...any[]]): any;
  (...args: [infer N15, infer C15, ...any[]]): any;
  (...args: [infer N16, infer C16, ...any[]]): any;
  (...args: [infer N17, infer C17, ...any[]]): any;
  (...args: [infer N18, infer C18, ...any[]]): any;
  (...args: [infer N19, infer C19, ...any[]]): any;
  (...args: [infer N20, infer C20, ...any[]]): any;
}
  ?
      | [N1, C1]
      | [N2, C2]
      | [N3, C3]
      | [N4, C4]
      | [N5, C5]
      | [N6, C6]
      | [N7, C7]
      | [N8, C8]
      | [N9, C9]
      | [N10, C10]
      | [N11, C11]
      | [N12, C12]
      | [N13, C13]
      | [N14, C14]
      | [N15, C15]
      | [N16, C16]
      | [N17, C17]
      | [N18, C18]
      | [N19, C19]
      | [N20, C20]
  : never;
