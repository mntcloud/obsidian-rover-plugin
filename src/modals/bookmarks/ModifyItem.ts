import { App, Modal, Setting } from "obsidian";

export class ModifyItemModal extends Modal {
  emoji: string;
  newName: string;

  constructor(
    app: App,
    oldName: string,
    emojicon: string,
    onSubmit: (name: string, emoji: string, path?: string) => void,
    path?: string,
  ) {
    super(app);
    this.setTitle("Modify the folder or bookmark");

    this.newName = oldName;
    new Setting(this.contentEl)
      .setName("Name")
      .addText((text) =>
        text.setValue(this.newName).onChange((value) => {
          this.newName = value;
        })
      );

    this.emoji = emojicon;
    new Setting(this.contentEl)
      .setName("Emoji")
      .setDesc("Click on the field below and Use WIN + ;")
      .addText((text) => {
        text
          .setValue(this.emoji)
          .onChange((value) => {
            if (this.emoji && this.emoji != value) {
              this.emoji = value.slice(this.emoji.length);
              text.setValue(this.emoji);
            } else {
              this.emoji = value;
            }
          });
      });
    if (path) {
      new Setting(this.contentEl)
        .setName("Path")
        .setDesc(`The path you set is: ${path}`);
    }

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            this.close();
            onSubmit(this.newName, this.emoji, path);
          })
      );
  }
}
