import { App, Modal, Setting } from 'obsidian';

export class CreateFolderModal extends Modal {
  emoji?: string
  
  constructor(app: App, onSubmit: (name: string, emoji: string) => void) {
    super(app);
    this.setTitle('Create a bookmark folder');

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

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Submit')
          .setCta()
          .onClick(() => {
            this.close();
            onSubmit(name, this.emoji!);
          }));
  }
}