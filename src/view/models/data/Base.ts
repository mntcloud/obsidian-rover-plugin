export interface RoverFile {
	mtime: number,
	name: string
    path: string
	isFolder: boolean
}

export interface RoverBookmark {
    crd: number,
	name: string
	emojicon: string
	path?: string
    children?: RoverBookmark[]
}

