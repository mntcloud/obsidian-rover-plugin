import m from "mithril"

import { ItemView, WorkspaceLeaf } from "obsidian";
import { ContainerView } from "./components/ContainerView";

export const VIEW_TYPE = 'rover-view';

export class RoverSidebarView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.icon = "bot";
    this.navigation = false;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return 'Rover';
  }


  async onOpen() {
    const container = this.containerEl;

    container.empty();

    m.mount(container, ContainerView)    
  }

  async onClose() {
    const container = this.containerEl;

    // unmount
    m.mount(container, null)
  }
}