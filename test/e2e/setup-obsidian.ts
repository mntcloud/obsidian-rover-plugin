import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const OBSIDIAN_VERSION = "1.12.7";

async function main() {
  const workDir = join(tmpdir(), `extract-obsidian-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  const archivePath = join(workDir, "obsidian.tar.gz");

  try {
    console.log("Downloading obsidian...");
    const res = await fetch(
      `https://github.com/obsidianmd/obsidian-releases/releases/download/v${OBSIDIAN_VERSION}/obsidian-${OBSIDIAN_VERSION}.tar.gz`,
    );

    if (!res.ok)
      throw new Error(`Download failed: ${res.status} ${res.statusText}`);

    const buffer = await res.arrayBuffer();
    writeFileSync(archivePath, Buffer.from(buffer));

    console.log(`Extracting to ${workDir}...`);
    execSync(`tar -xzf "${resolve(archivePath)}" -C "${resolve(workDir)}"`, {
      stdio: "inherit",
    });
    console.log("Extraction complete");

    const resourcesSrc = join(workDir, "obsidian-1.12.7", "resources");
    if (!existsSync(resourcesSrc)) {
      throw new Error(`'resources' directory not found in archive`);
    }

    mkdirSync(dirname("./test/e2e/.obsidian/resources"), { recursive: true });
    try {
      renameSync(resourcesSrc, "./test/e2e/.obsidian/resources");
    } catch (err) {
      throw err;
    }
  } finally {
    console.log("Cleaning up temp files...");
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
