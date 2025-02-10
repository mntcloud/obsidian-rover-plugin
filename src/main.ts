import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { RoverSidebarView, VIEW_TYPE } from 'view/RoverSidebarView';

import * as utils from "./utils";
import { initDataSource, Obsidian, RoverPluginSettings } from 'view/models/data/Obsidian';
import { Recents } from 'view/models/RecentsModel';
import { Bookmarks } from "view/models/BookmarksModel";

const DEFAULT_SETTINGS: RoverPluginSettings = {
	mySetting: 'default',
	bookmarks: [],
	recents: [],	
}

export default class RoverPlugin extends Plugin {
	settings: RoverPluginSettings;

	async onload() {


		await this.loadSettings();

		initDataSource(this.app, this.settings, () => {
			this.settings = Obsidian!.settings
			this.saveSettings()
		})

		Bookmarks.items = this.settings.bookmarks

		Recents.list = this.settings.recents

		this.registerView(
			VIEW_TYPE,
			(leaf) => new RoverSidebarView(leaf)
		)

		this.app.workspace.onLayoutReady(async () => {

			await this.activateView();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new RoverSettingTab(this.app, this));

		utils.log("deployed on Obsidian");
	}

	async onunload() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE)

		leaves.forEach((leaf) => {
			leaf.detach();
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;


		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (!leaves.length) {
			const leaf: WorkspaceLeaf | null = workspace.getLeftLeaf(false)!;

			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}
	}
}

class RoverSettingTab extends PluginSettingTab {
	plugin: RoverPlugin;

	constructor(app: App, plugin: RoverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
