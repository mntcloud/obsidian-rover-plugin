import { Explorer } from "view/models/ExplorerModel";
import { Obsidian } from "view/models/data/Obsidian";

jest.mock("view/models/data/Obsidian");

const mockedObsidian = jest.mocked(Obsidian);

// NOTE: this code was partially generated by LLM and partially corrected by hand
//       because I am lazy to repeat and edit, only interested in writing a simple comment
//       about test case

describe("Vault Listeners", () => {
    beforeAll(() => {
        Explorer.isBeingTested = true;
    });

    test("on folder rename in root", async () => {
        const renameMap = new Map<string, string>();

        renameMap.set("folderB", "folderA");
        renameMap.set("folderB/file1.md", "folderA/file1.md");
        renameMap.set("folderB/subfolder1", "folderA/subfolder1");
        renameMap.set(
            "folderB/subfolder1/file2.md",
            "folderA/subfolder1/file2.md",
        );
        renameMap.set("folderB/subfolder2", "folderA/subfolder2");
        renameMap.set(
            "folderB/subfolder2/file3.md",
            "folderA/subfolder2/file3.md",
        );
        renameMap.set(
            "folderB/subfolder2/subfolder3",
            "folderA/subfolder2/subfolder3",
        );
        renameMap.set(
            "folderB/subfolder2/subfolder3/file4.md",
            "folderA/subfolder2/subfolder3/file4.md",
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                console.log(`STAT: ${path}`);

                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                expect(isRoot).toBeTruthy();
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(1);
    });

    test("move folder and rename it at the same time", async () => {
        // old -> new
        // folderA/folderB/folderC/folderD/folderE -> folderC/folderD/folderE/folderF/folderG

        const renameMap = new Map<string, string>();
        const oldBasePath = "folderA/folderB/folderC/folderD/folderE";
        const newBasePath = "folderC/folderD/folderE/folderF/folderG";

        renameMap.set(newBasePath, oldBasePath);
        renameMap.set(`${newBasePath}/file1.md`, `${oldBasePath}/file1.md`);
        renameMap.set(`${newBasePath}/subfolder1`, `${oldBasePath}/subfolder1`);
        renameMap.set(
            `${newBasePath}/subfolder1/file2.md`,
            `${oldBasePath}/subfolder1/file2.md`,
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                const now = Date.now();
                // Old paths (like oldBasePath and its children) should not exist
                if (path.startsWith(oldBasePath)) {
                    return null;
                }

                // Paths that should exist after the rename
                const existingPathData: Record<
                    string,
                    { type: "folder" | "file"; size: number }
                > = {
                    // Old path's parent and its ancestors
                    "folderA": { type: "folder", size: 0 },
                    "folderA/folderB": { type: "folder", size: 0 },
                    "folderA/folderB/folderC": { type: "folder", size: 0 },
                    "folderA/folderB/folderC/folderD": {
                        type: "folder",
                        size: 0,
                    }, // Parent of oldBasePath

                    // New path's parent and its ancestors
                    "folderC": { type: "folder", size: 0 },
                    "folderC/folderD": { type: "folder", size: 0 },
                    "folderC/folderD/folderE": { type: "folder", size: 0 },
                    "folderC/folderD/folderE/folderF": {
                        type: "folder",
                        size: 0,
                    }, // Parent of newBasePath

                    // New path itself and its contents
                    [newBasePath]: { type: "folder", size: 0 },
                    [`${newBasePath}/file1.md`]: { type: "file", size: 100 },
                    [`${newBasePath}/subfolder1`]: { type: "folder", size: 0 },
                    [`${newBasePath}/subfolder1/file2.md`]: {
                        type: "file",
                        size: 100,
                    },
                };

                if (existingPathData[path]) {
                    return {
                        type: existingPathData[path].type,
                        ctime: now,
                        mtime: now,
                        size: existingPathData[path].size,
                    };
                }
                return null; // For any other path not specified
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                expect(isRoot).toBeFalsy();
                // Expect updates for the old parent and the new parent path
                expect([
                    "folderA/folderB/folderC/folderD", // Parent of oldBasePath
                    "folderC/folderD/folderE/folderF", // Parent of newBasePath
                ]).toContain(path);
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(2);
    });

    test("rename folder inside another folder", async () => {
        // old -> new
        // folderA/folderB -> folderA/folderC

        const renameMap = new Map<string, string>();

        renameMap.set("folderA/folderC", "folderA/folderB");
        renameMap.set("folderA/folderC/file1.md", "folderA/folderB/file1.md");
        renameMap.set(
            "folderA/folderC/subfolder1",
            "folderA/folderB/subfolder1",
        );
        renameMap.set(
            "folderA/folderC/subfolder1/file2.md",
            "folderA/folderB/subfolder1/file2.md",
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                const now = Date.now();
                const existingPathData: Record<
                    string,
                    { type: "folder" | "file"; size: number }
                > = {
                    "folderA/folderC": { type: "folder", size: 0 }, // New path
                    "folderA": { type: "folder", size: 0 }, // Parent folder
                    "folderA/folderC/file1.md": { type: "file", size: 100 },
                    "folderA/folderC/subfolder1": { type: "folder", size: 0 },
                    "folderA/folderC/subfolder1/file2.md": {
                        type: "file",
                        size: 100,
                    },
                };

                if (existingPathData[path]) {
                    return {
                        type: existingPathData[path].type,
                        ctime: now,
                        mtime: now,
                        size: existingPathData[path].size,
                    };
                }
                // For "folderA/folderB" (old path) or any other unspecified path, return null.
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                expect(isRoot).toBeFalsy();
                expect(path).toBe("folderA");
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(1);
    });

    test("move folder from root", async () => {
        const renameMap = new Map<string, string>();

        renameMap.set("folderB/folderC/folderA", "folderA");
        renameMap.set("folderB/folderC/folderA/file1.md", "folderA/file1.md");
        renameMap.set(
            "folderB/folderC/folderA/subfolder1",
            "folderA/subfolder1",
        );
        renameMap.set(
            "folderB/folderC/folderA/subfolder1/file2.md",
            "folderA/subfolder1/file2.md",
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                if (path === "folderA") {
                    return null;
                }

                if (path === "folderB/folderC/folderA" || path === "") {
                    return {
                        type: "folder",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 0,
                    };
                }
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                if (isRoot) {
                    expect(path).toBeUndefined();
                } else {
                    expect(path).toMatch(/folderB\/folderC/);
                }
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(2);
    });

    test("move file from root to different location", async () => {
        const renameMap = new Map<string, string>();

        // Moving file1.md from root to folderB/folderC
        renameMap.set("folderB/folderC/file1.md", "file1.md");

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                // The new file path "folderB/folderC/file1.md" will exist.
                if (path === "folderB/folderC/file1.md") {
                    return {
                        type: "file",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 100,
                    };
                }
                // Assume parent folders exist for simplicity in this test's stat mock
                if (
                    path === "folderB" || path === "folderB/folderC" ||
                    path === ""
                ) {
                    return {
                        type: "folder",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 0,
                    };
                }
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                if (isRoot) {
                    expect(path).toBeUndefined();
                } else {
                    expect(path).toMatch(/folderB\/folderC/);
                }
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(2);
    });

    test("move folder with repeating paths", async () => {
        // old -> new
        // folderB/folderB/folderB -> folderD/folderB/folderB/folderB/folderB
        const renameMap = new Map<string, string>();

        const oldBase = "folderB/folderB/folderB";
        const newBase = "folderD/folderB/folderB/folderB/folderB";

        renameMap.set(newBase, oldBase);
        renameMap.set(`${newBase}/file1.md`, `${oldBase}/file1.md`);
        renameMap.set(`${newBase}/subfolder1`, `${oldBase}/subfolder1`);
        renameMap.set(
            `${newBase}/subfolder1/file2.md`,
            `${oldBase}/subfolder1/file2.md`,
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                const now = Date.now();
                // Old paths should not exist
                if (path.startsWith(oldBase)) {
                    return null;
                }

                // New paths and their parents should exist
                const existingPathData: Record<
                    string,
                    { type: "folder" | "file"; size: number }
                > = {
                    "folderB": { type: "folder", size: 0 },
                    "folderB/folderB": { type: "folder", size: 0 }, // Old parent
                    "folderD": { type: "folder", size: 0 }, // New parent part 1
                    "folderD/folderB": { type: "folder", size: 0 }, // New parent part 2
                    "folderD/folderB/folderB": { type: "folder", size: 0 }, // New parent part 3
                    "folderD/folderB/folderB/folderB": {
                        type: "folder",
                        size: 0,
                    }, // New parent part 4 (parent of newBase)
                    [newBase]: { type: "folder", size: 0 },
                    [`${newBase}/file1.md`]: { type: "file", size: 100 },
                    [`${newBase}/subfolder1`]: { type: "folder", size: 0 },
                    [`${newBase}/subfolder1/file2.md`]: {
                        type: "file",
                        size: 100,
                    },
                };

                if (existingPathData[path]) {
                    return {
                        type: existingPathData[path].type,
                        ctime: now,
                        mtime: now,
                        size: existingPathData[path].size,
                    };
                }
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                expect(isRoot).toBeFalsy();
                // Expect updates for the old parent and the new parent path
                // Old parent: folderB/folderB
                // New parent: folderD/folderB/folderB/folderB
                expect(["folderB/folderB", "folderD/folderB/folderB/folderB"])
                    .toContain(path);
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(2);
    });

    test("move folder with a little of repeating paths", async () => {
        // old -> new
        // folderB/folderB -> folderD/folderB/folderB

        const renameMap = new Map<string, string>();

        const oldBase = "folderB/folderB";
        const newBase = "folderD/folderB/folderB";

        renameMap.set(newBase, oldBase);
        renameMap.set(`${newBase}/file1.md`, `${oldBase}/file1.md`);
        renameMap.set(`${newBase}/subfolder1`, `${oldBase}/subfolder1`);
        renameMap.set(
            `${newBase}/subfolder1/file2.md`,
            `${oldBase}/subfolder1/file2.md`,
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                const now = Date.now();
                // Old paths should not exist
                if (path.startsWith(oldBase)) {
                    return null;
                }

                // New paths and their parents should exist
                const existingPathData: Record<
                    string,
                    { type: "folder" | "file"; size: number }
                > = {
                    "folderB": { type: "folder", size: 0 }, // Old parent
                    "folderD": { type: "folder", size: 0 }, // New parent part 1
                    "folderD/folderB": { type: "folder", size: 0 }, // New parent part 2
                    [newBase]: { type: "folder", size: 0 },
                    [`${newBase}/file1.md`]: { type: "file", size: 100 },
                    [`${newBase}/subfolder1`]: { type: "folder", size: 0 },
                    [`${newBase}/subfolder1/file2.md`]: {
                        type: "file",
                        size: 100,
                    },
                };

                if (existingPathData[path]) {
                    return {
                        type: existingPathData[path].type,
                        ctime: now,
                        mtime: now,
                        size: existingPathData[path].size,
                    };
                }
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                expect(isRoot).toBeFalsy();
                // Expect updates for the old parent and the new parent path
                // Old parent: folderA
                // New parent: folderD/folderB
                expect(["folderB", "folderD/folderB"]).toContain(path);
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(2);
    });

    test("move folder with children to deeply nested location", async () => {
        const renameMap = new Map<string, string>();

        const oldBase = "parentFolder/folderToMove";
        const newBase = "deeply/nested/destination/folderToMove";

        renameMap.set(newBase, oldBase);
        renameMap.set(`${newBase}/file1.md`, `${oldBase}/file1.md`);
        renameMap.set(`${newBase}/childFolder`, `${oldBase}/childFolder`);
        renameMap.set(
            `${newBase}/childFolder/file2.md`,
            `${oldBase}/childFolder/file2.md`,
        );

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                // Old paths should not exist
                if (path.startsWith("parentFolder/folderToMove")) {
                    return null;
                }
                // New paths should exist
                if (
                    path === "deeply" ||
                    path === "deeply/nested" ||
                    path === "deeply/nested/destination" ||
                    path === newBase ||
                    path === `${newBase}/childFolder` ||
                    path === "parentFolder"
                ) {
                    return {
                        type: "folder",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 0,
                    };
                }
                if (path === `${newBase}/file1.md`) {
                    return {
                        type: "file",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 100,
                    };
                }
                if (path === `${newBase}/childFolder/file2.md`) {
                    return {
                        type: "file",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 100,
                    };
                }
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                if (isRoot) {
                    expect(path).toBeUndefined();
                } else {
                    // Expect updates for the old parent and the new parent path
                    expect(path).toMatch(
                        /deeply\/nested\/destination|parentFolder/,
                    );
                }
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }
        console.log(onUpdate.mock.calls);
        expect(onUpdate.mock.calls.length).toBe(2);
    });

    test("rename file in folder", async () => {
        const renameMap = new Map<string, string>();

        // old -> new
        // folder1/file.md -> folder1/another.md

        renameMap.set("folder1/another.md", "folder1/file.md");

        mockedObsidian?.vault.adapter.stat.mockImplementation(
            async (path: string) => {
                // The old file path "folder1/file.md" should not exist.
                if (path === "folder1/file.md") {
                    return null;
                }
                // The new file path "folder1/another.md" should exist.
                if (path === "folder1/another.md") {
                    return {
                        type: "file",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 100,
                    };
                }
                // The parent folder "folder1" should exist.
                if (path === "folder1") {
                    return {
                        type: "folder",
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 0,
                    };
                }
                return null;
            },
        );

        const onUpdate = jest.fn().mockImplementation(
            async (isRoot: boolean, path?: string) => {
                expect(isRoot).toBeFalsy();
                expect(path).toBe("folder1");
            },
        );

        for (const [newPath, oldPath] of renameMap.entries()) {
            await Explorer.onRename(
                newPath,
                oldPath,
                onUpdate,
            );
        }

        expect(onUpdate.mock.calls.length).toBe(1);
    });
});
