import { App, Modal, Setting } from 'obsidian';

export class CreateItemModal extends Modal {
  emoji?: string
  
  constructor(app: App, defaultPath: string, onSubmit: (name: string, emoji: string, path: string) => void) {
    super(app);
    this.setTitle('Create a bookmark');

    let name = '';
    new Setting(this.contentEl)
      .setName('Name')
      .addText((text) =>
        text.onChange((value) => {
          name = value;
        }));

    new Setting(this.contentEl)
      .setName("Emoji")
      .addText((text) => {
        text
          .setPlaceholder("Use WIN + ;")
          .onChange((value) => {
            if (this.emoji && this.emoji != value) {
              this.emoji = value.slice(this.emoji.length)
              text.setValue(this.emoji);
            } else {
              this.emoji = value;
            }
          });
      })


    let path = defaultPath;
    new Setting(this.contentEl)
      .setName('Path')
      .addText((text) =>
        text
          .setValue(path)
          .onChange((value) => {
            path = value;
          }));

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Submit')
          .setCta()
          .onClick(() => {
            this.close();
            onSubmit(name, this.emoji!, path);
          }));
  }
}