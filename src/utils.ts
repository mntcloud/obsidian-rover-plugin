export function log(msg: string) { 
	console.log("%c ROVER ", "background-color: orange; color: black; font-weight: 600;", msg)
}

export function error(msg: string) {
	console.error("%c ROVER ", "background-color: crimson; color: black; font-weight: 600;", msg)
}