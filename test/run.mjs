#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { glob } from "node:fs/promises";
import * as esbuild from "esbuild";

const tsc = spawnSync("yarn", ["tsc", "--noEmit"], {
  stdio: "inherit",
  shell: true,
});
if (tsc.status !== 0) process.exit(tsc.status);

const OUT = ".test-out";
mkdirSync(OUT, { recursive: true });

const files = [];
for await (const f of glob("./test/**/*.test.ts", {
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
  outdir: OUT,
  plugins: [
    {
      name: "good-guy-qa",
      setup(build) {
        build.onEnd((_) => {
          spawnSync("node", ["--enable-source-maps", "--test"], {
            stdio: "inherit",
            shell: true,
            cwd: ".test-out",
          });
        });
      },
    },
  ],
});

await ctx.watch({});
