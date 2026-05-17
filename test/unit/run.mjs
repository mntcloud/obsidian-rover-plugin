#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { glob } from "node:fs/promises";
import { join } from "node:path";
import builtins from "builtin-modules";
import * as esbuild from "esbuild";

const tsc = spawnSync("yarn", ["tsc", "--noEmit"], {
  stdio: "inherit",
  shell: true,
});
if (tsc.status !== 0) process.exit(tsc.status);

const OUT = ".test-out";
mkdirSync(OUT, { recursive: true });

const files = [];
for await (const f of glob("./test/unit/**/*.test.ts", {
  exclude: (p) => p.includes("node_modules"),
})) {
  files.push(f);
}

const ctx = await esbuild.context({
  entryPoints: files,
  bundle: true,
  sourcemap: "inline",
  platform: "node",
  format: "esm",
  outExtension: { ".js": ".mjs" },
  external: [
    "jsdom",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  outdir: OUT,
  plugins: [
    {
      name: "good-guy-qa",
      setup(build) {
        build.onResolve({ filter: /obsidian/ }, (args) => {
          return { path: join(process.cwd(), "test/unit/mocks/obsidian.ts") };
        });

        build.onEnd((_) => {
          spawnSync(
            "node",
            [
              "--enable-source-maps",
              "--experimental-test-module-mocks",
              "--test",
            ],
            {
              stdio: "inherit",
              shell: true,
              cwd: ".test-out",
            },
          );
        });
      },
    },
  ],
});

await ctx.watch({});
