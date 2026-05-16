import { expect, test } from "./obsidian-test";

test("active file must change when user switch between file tabs", async ({
  window,
  plugin,
}) => {
  await window
    .locator(".rover-file-manager div.rover-file")
    .filter({ hasText: /^File0$/ })
    .click();
  await window
    .locator("div")
    .filter({ hasText: /^folder$/ })
    .nth(1)
    .click();
  await window
    .locator("div")
    .filter({ hasText: /^folder2$/ })
    .nth(1)
    .click();
  await window.getByLabel("New tab").nth(1).click();
  await window
    .locator(".rover-file-manager div.rover-file")
    .filter({ hasText: /^File2$/ })
    .click();
  await window
    .locator("div")
    .filter({ hasText: /^File0$/ })
    .nth(4)
    .click();
  await expect(
    window.locator(".rover-recents div.rover-file.active"),
  ).toHaveText("File0");

  await window
    .locator("div")
    .filter({ hasText: /^File2$/ })
    .nth(3)
    .click();
  await expect(
    window.locator(".rover-recents div.rover-file.active"),
  ).toHaveText("File2");
});
test("active file must indicate it's empty, when no single tab is present", async ({
  window: win,
  plugin,
}) => {
  await win
    .locator(".rover-file-manager div.rover-file")
    .filter({ hasText: /^File0$/ })
    .click();

  await win.getByLabel("File0", { exact: true }).getByLabel("Close").click();
  await expect(win.locator("body")).toContainText("No active file");
});
