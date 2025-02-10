import { basename, dirname } from "node:path";

import m from "mithril";

import { File } from "./FileManager/File";
import { Folder } from "./FileManager/Folder";
import { RoverFile } from "view/models/data/Base";
import { Obsidian } from "view/models/data/Obsidian";
import { EventRef, TAbstractFile } from "obsidian";

export class FileManagerSubView implements m.ClassComponent {
    root: RoverFile[]
    evrefs: EventRef[]

    oninit(vnode: m.Vnode<Attr, this>) {
        this.structureUpdate().then(() => m.redraw())
    }

    handleVaultUpdate(dom: Element, file: TAbstractFile) {
        if (file.name != file.path) {
            const dirpath = dirname(file.path)

            const element = dom.querySelector(`div[data-path="${dirpath}"]`)

            // With rename of folder, it triggers in the same time rename of multiple files/folders and
            // structureUpdate can't update the tree in time, so I can't figure out how
            // to solve this problem except I can dispatch in if clause and it's not
            // perfect and ambiqutios to debug, but well i dunno...
            // TODO: find a solution to the rename problem
            if (element) {
                element.dispatchEvent(new Event("structureupdate", {bubbles: false}))
            }
        } else {
            this.structureUpdate().then(() => m.redraw())
        }
    }

    oncreate(vnode: m.VnodeDOM<Attr, this>) {
        this.evrefs = [
            Obsidian!.vault.on("create", (file) => this.handleVaultUpdate(vnode.dom, file)),
            Obsidian!.vault.on("rename", (file) => this.handleVaultUpdate(vnode.dom, file)),
            Obsidian!.vault.on("delete", (file) => this.handleVaultUpdate(vnode.dom, file)),
        ]
    }
    
    onremove(vnode: m.VnodeDOM<Attr, this>) {
        this.evrefs.forEach((ref) => Obsidian!.vault.offref(ref))
    }

    async structureUpdate() {
        this.root = []

        const workspaceRoot = Obsidian!.vault.getRoot()

        for (const item of workspaceRoot.children) {
            const stat = await Obsidian!.vault.adapter.stat(item.path)


            this.root.push({
                mtime: stat!.ctime,
                name: stat!.type != "folder" ? basename(item.name, ".md") : item.name,
                path: item.path,
                isFolder: stat!.type == "folder"
            })
        }

        this.root.sort((fileA, fileB) => fileA.isFolder ? -1 : 0)
    }

    view(vnode: m.Vnode<Attr, this>) {
        return (
            <div className="rover-container rover-file-manager">
                {this.root.map((file) => {
                    return file.isFolder ?
                        <Folder key={file.mtime} name={file.name} path={file.path} nest={0} /> :
                        <File key={file.mtime} name={file.name} path={file.path} nest={0} />
                })}
            </div>
        )
    }
}