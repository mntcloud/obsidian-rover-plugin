import { cp, readdir, rm } from "fs/promises";
import { BASE_PATH, expect, test } from "./obsidian-test";
import path from "path";

test.afterEach(async () => {
  const vault = await readdir(path.join(BASE_PATH, ".vault")).then(
    (structure) =>
      structure
        .filter((item) => item.indexOf(".obsidian") == -1)
        .map((item) => path.join(BASE_PATH, ".vault", item)),
  );

  for (const item of vault) {
    await rm(item, { recursive: true });
  }

  const baseVault = await readdir(path.join(BASE_PATH, "vault")).then(
    (structure) => structure.filter((item) => item.indexOf(".obsidian") == -1),
  );

  for (const item of baseVault) {
    await cp(
      path.join(BASE_PATH, "vault", item),
      path.join(BASE_PATH, ".vault", item),
      { recursive: true },
    );
  }
});

test("when a file is renamed, explorer view must be updated", async ({
  window,
  plugin,
}) => {
  await window
    .locator("div")
    .filter({ hasText: /^folder$/ })
    .nth(1)
    .click();
  await window
    .locator("div.rover-folder-container div")
    .filter({ hasText: /^File1$/ })
    .first()
    .click({
      button: "right",
    });
  await window.getByText("Rename...").click();
  await window.getByRole("textbox").fill("File1_0");
  await window.getByRole("textbox").press("Enter");
  await expect(window.locator("body")).toContainText("File1_0");
});
test("when a file is deleted, explorer view must be updated", async ({
  window,
  plugin,
}) => {
  await window
    .locator(".rover-file-manager div")
    .filter({ hasText: /^File0$/ })
    .click({
      button: "right",
    });
  await window.getByText("Delete").click();
  await expect(
    window.locator(".rover-file-manager div").filter({ hasText: /^File0$/ }),
  ).not.toBeVisible();
});
test("when a folder is dropped into neighbor", async ({ window, plugin }) => {
  await window
    .locator(".rover div")
    .filter({ hasText: /^folder$/ })
    .nth(1)
    .click();
  await window
    .locator(".rover div")
    .filter({ hasText: /^folder2$/ })
    .nth(1)
    .click();

  await window.getByText("folder3").click();

  await window.getByText("folder4").click();

  await window
    .locator(".rover .rover-folder")
    .filter({ hasText: /^folder4$/ })
    .dragTo(window.getByText("folder3"));

  await expect(
    window.locator(".rover .rover-folder").filter({ hasText: /^folder4$/ }),
  ).toHaveCount(1);
});
test("when a folder is moved from parent folder to it's grandparent", async ({
  window,
  plugin,
}) => {
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

  await window
    .locator(".rover-folder")
    .filter({ hasText: /^folder4$/ })
    .dragTo(
      window.locator(".rover .rover-folder").filter({ hasText: /^folder$/ }),
    );

  await expect(
    window.locator(".rover-folder").filter({ hasText: /^folder4$/ }),
  ).toHaveCount(1);
});
test("when a folder is moved from parent folder to the root", async ({
  window,
  plugin,
}) => {
  await window
    .locator("div")
    .filter({ hasText: /^folder$/ })
    .nth(1)
    .click();
  await expect(
    window
      .locator("div")
      .filter({ hasText: /^folder2$/ })
      .first(),
  ).toBeVisible();

  await window
    .locator("div")
    .filter({ hasText: /^folder2$/ })
    .first()
    .dragTo(window.getByText("folderfolder2File1File0"));

  await expect(
    window.locator(".rover-folder").filter({ hasText: /^folder2$/ }),
  ).toHaveCount(1);
});
