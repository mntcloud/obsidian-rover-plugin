#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { normalize } from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { glob } from "node:fs/promises";

const OUT = ".test-out";
mkdirSync(OUT, { recursive: true });

const files = [];
for await (const f of glob("./test/**/*.test.ts", {
  exclude: p => p.includes("node_modules")
})) {
  files.push(f);
}

const tsc = spawnSync("yarn", ["tsc", "--noEmit"], {
  stdio: "inherit",
  shell: true
});

const build = spawnSync(
  "yarn",
  // bundle this bitch up, and destroy correct exceptions
  [
    "esbuild",
    ...files,
    "--sourcemap=inline",
    "--platform=node",
    "--bundle",
    "--format=esm",
    "--out-extension:.js=.mjs",
    `--outdir=${OUT}`
  ],
  { stdio: "inherit", shell: true }
);
if (build.status !== 0) process.exit(build.status);

const run = spawnSync("node", ["--enable-source-maps", "--test"], {
  stdio: "inherit",
  shell: true,
  cwd: ".test-out"
});
process.exit(run.status);
