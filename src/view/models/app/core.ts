import { App, Workspace, Vault } from "obsidian";

export interface RoverFile {
  mtime: number;
  name: string;
  path: string;
  isFolder: boolean;
}

export interface RoverBookmark {
  crd: number;
  name: string;
  emojicon: string;
  path?: string;
  children?: RoverBookmark[];
}

export interface ObsidianAppModel {
  app: App;
  workspace: Workspace;
  vault: Vault;

  settings: RoverPluginSettings;
  save: () => void;
}

export interface RoverPluginSettings {
  mySetting: string;
  bookmarks: RoverBookmark[];
  recents: string[];
}
