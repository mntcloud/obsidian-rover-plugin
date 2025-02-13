import { basename, dirname } from "node:path";

import m from "mithril";

import { File } from "./FileManager/File";
import { Folder } from "./FileManager/Folder";
import { RoverFile } from "view/models/data/Base";
import { Obsidian } from "view/models/data/Obsidian";
import { EventRef, TAbstractFile } from "obsidian";
import { FileModel } from "view/models/FileManagerModel";

export class FileManagerSubView implements m.ClassComponent {
    root: RoverFile[]
    evrefs: EventRef[]

    oninit(vnode: m.Vnode<Attr, this>) {
        this.root = []
        this.structureUpdate().then(() => m.redraw())
    }

    onCreateDelete(dom: Element, file: string, enableRedraw = true) {
        if (FileModel.countSegments(file)) {
            const dirpath = dirname(file)

            const element = dom.querySelector(`div[data-path="${dirpath}"]`)

            if (element) {
                element.dispatchEvent(new Event("createdelete", { bubbles: false }))
                if (enableRedraw) {
                    m.redraw()
                }
            }
        } else {
            this.structureUpdate().then(() => {
                console.log(`FOLDER ROOT ${performance.now()}: redraw`)
                if (enableRedraw) {
                    m.redraw()
                }
            })
        }
    }


    async onRename(dom: Element, file: TAbstractFile, oldPath: string) {
        const path = file.path.split("/")
        const old = oldPath.split("/")

        // NOTE:
        // Rename handler can be invoked, when folder is renamed
        // and Obsidian will pass some uncessary new and old paths with 
        // folder and files that are the same, we only execute updates
        // when file or folder name from new and old are not the same
        // 
        // EXAMPLE:
        // NEW: dev/hacking/rover/file.md
        // OLD: dev/rnd/rover/file.md
        if (path.last() != old.last()) {
            if (path.length == old.length) {
                if (path.length == 1) {
                    this.structureUpdate().then(() => {
                        console.log(`ROOT UPDATE: ${performance.now()}`)
                        m.redraw()
                    })
                } else {
                    const dirpath = dirname(file.path)
                    const element = dom.querySelector(`div[data-path="${dirpath}"]`)

                    if (element) {
                        element.dispatchEvent(new Event("createdelete", { bubbles: false }))
                    }
                }
            } else {
                if (old.length == 1 || path.length == 1) {
                    this.structureUpdate().then(() => {
                        console.log(`FOLDER ${oldPath} ${file.path}`)

                        const dirpath = dirname(old.length < path.length ? file.path : oldPath)
                        const element = dom.querySelector(`div[data-path="${dirpath}"]`)

                        if (element) {
                            element.dispatchEvent(new Event("createdelete", { bubbles: false }))
                        }

                        m.redraw()
                    })
                } else {
                    const oldDirPath = dirname(oldPath)
                    const newDirPath = dirname(file.path)

                    const oldFolder = dom.querySelector(`div[data-path="${oldDirPath}"]`)
                    const newFolder = dom.querySelector(`div[data-path="${newDirPath}"]`)

                    if (oldFolder && newFolder) {
                        oldFolder.dispatchEvent(new Event("createdelete", { bubbles: false }))
                        newFolder.dispatchEvent(new Event("createdelete", { bubbles: false }))
                    }
                }
            }
        } else {
            if (path.length == old.length) {
                // we need to check for existence of folder or file,
                // because if rename happens, folder in old path doesn't match the new one
                // and also it doesn't exists anymore and move happens only in existent folders
                for (let i = old.length - 1; i >= 0; i--) {
                    if (old[i] != path[i]) {
                        const oldPartialPath = old.slice(0, i + 1).join("/")
                        const stat = await Obsidian!.vault.adapter.stat(oldPartialPath)

                        if (stat) {
                            const oldDirPath = dirname(oldPath)
                            const newDirPath = dirname(file.path)

                            const oldFolder = dom.querySelector(`div[data-path="${oldDirPath}"]`)
                            const newFolder = dom.querySelector(`div[data-path="${newDirPath}"]`)

                            if (oldFolder) {
                                oldFolder.dispatchEvent(new Event("createdelete", { bubbles: false }))
                            }

                            if (newFolder) {
                                newFolder.dispatchEvent(new Event("createdelete", { bubbles: false }))
                            }
                        } else {
                            break
                        }
                    }
                }
            } else {
                const oldDirPath = dirname(oldPath)
                const newDirPath = dirname(file.path)

                const oldFolder = dom.querySelector(`div[data-path="${oldDirPath}"]`)
                const newFolder = dom.querySelector(`div[data-path="${newDirPath}"]`)

                if (oldFolder) {
                    oldFolder.dispatchEvent(new Event("createdelete", { bubbles: false }))
                }

                if (newFolder) {
                    newFolder.dispatchEvent(new Event("createdelete", { bubbles: false }))
                }
            }
        }
    }

    oncreate(vnode: m.VnodeDOM<Attr, this>) {
        this.evrefs = [
            Obsidian!.vault.on("create", (file) => this.onCreateDelete(vnode.dom, file.path)),
            Obsidian!.vault.on("rename", (file, oldPath) => this.onRename(vnode.dom, file, oldPath)),
            Obsidian!.vault.on("delete", (file) => this.onCreateDelete(vnode.dom, file.path)),
        ]
    }

    onremove(vnode: m.VnodeDOM<Attr, this>) {
        this.evrefs.forEach((ref) => Obsidian!.vault.offref(ref))
    }

    async structureUpdate() {
        const newRoot = []
        const workspaceRoot = Obsidian!.vault.getRoot()

        for (const item of workspaceRoot.children) {
            const stat = await Obsidian!.vault.adapter.stat(item.path)


            newRoot.push({
                mtime: stat!.ctime,
                name: stat!.type != "folder" ? basename(item.name, ".md") : item.name,
                path: item.path,
                isFolder: stat!.type == "folder"
            })
        }

        newRoot.sort((fileA, fileB) => fileA.isFolder ? -1 : 0)
        this.root = newRoot
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div className="rover-container rover-file-manager">
                {this.root.length ? this.root.map((file) => {
                    return file.isFolder ?
                        <Folder key={file.mtime} name={file.name} path={file.path} nest={0} /> :
                        <File key={file.mtime} name={file.name} path={file.path} nest={0} />
                }) : undefined}
            </div>
        )
    }
}