import {
  test as base,
  ElectronApplication,
  _electron as electron,
  Page,
  expect,
} from "@playwright/test";
import path from "path";
import { randomBytes } from "crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { RoverBookmark, RoverPluginSettings } from "rover/core";

export const BASE_PATH = path.resolve("./test/e2e");

export const test = base.extend<
  {
    window: Page;
    plugin: {
      setup: (bookmarks: RoverPluginSettings["bookmarks"]) => Promise<void>;
    };
  },
  { app: ElectronApplication }
>({
  app: [
    async ({}, use, _workerInfo) => {
      const main = path.join(BASE_PATH, ".obsidian");

      const vaultdir = path.join(BASE_PATH, ".vault");
      const datadir = path.join(BASE_PATH, ".userdata");

      await cp(path.resolve("./test/e2e/vault"), vaultdir, {
        recursive: true,
      });

      const userDataExists = existsSync(datadir);

      if (!userDataExists) {
        await mkdir(datadir);

        const config = {
          vaults: {
            [randomBytes(8).toString("hex")]: {
              path: vaultdir,
              ts: Date.now(),
              open: true,
            },
          },
        };

        await writeFile(
          path.join(datadir, "obsidian.json"),
          JSON.stringify(config),
        );
      }

      const obsidian = await electron.launch({
        args: [
          `--user-data-dir=${datadir}`,
          main,
          `obsidian://open?path=${encodeURIComponent(vaultdir)}`,
        ],
      });

      const window = await obsidian.firstWindow();

      // Wait for the Obsidian launcher window to finish loading
      await window.waitForLoadState("domcontentloaded");

      if (!userDataExists) {
        const warning = window.getByText(
          "Do you trust the author of this vault?",
        );
        await expect(warning).toBeVisible();

        await window.getByText("Trust author and enable plugins").click();
        await expect(warning).not.toBeVisible();

        const modalCloseButton = window.locator(".modal-close-button");

        await modalCloseButton.click();
        await expect(modalCloseButton).not.toBeAttached();
      }

      await use(obsidian);

      await obsidian.close();

      await rm(vaultdir, { recursive: true, force: true });
    },
    { scope: "worker" },
  ],

  window: async ({ app }, use) => {
    const win = await app.firstWindow();

    // Wait while Obsidian is loading
    await win.locator("div.workspace-tab-header").first().waitFor();

    // focus on editor tabs and close them all
    await win.evaluate(() => {
      const obsidianApp = (window as any).app;

      obsidianApp.commands.executeCommandById("editor:focus", false);
      obsidianApp.commands.executeCommandById(
        "workspace:close-tab-group",
        false,
      );
    });

    // ensure that commands worked well
    await win
      .locator("div.workspace-tab-header")
      .filter({ hasText: "New tab" })
      .first()
      .waitFor();

    await use(win);
  },

  plugin: async ({ window: app }, use) => {
    const tools = {
      setup: async (bookmarks: RoverPluginSettings["bookmarks"]) => {
        // // write to plugin settings
        const settingsPath = path.resolve(
          "./test/e2e/.vault/.obsidian/plugins/rover/data.json",
        );

        await writeFile(
          settingsPath,
          JSON.stringify({
            bookmarks,
            recents: [],
          }),
        );

        // reload plugin in Obsidian renderer
        await app.evaluate(async () => {
          const obsidianApp = (window as any).app;

          await obsidianApp.plugins.disablePlugin("rover-obsidian-plugin");
          await obsidianApp.plugins.enablePlugin("rover-obsidian-plugin");
        });
      },
    };

    await use(tools);

    // reset data.json back to empty
    await tools.setup([]);
  },
});

export { expect } from "@playwright/test";
