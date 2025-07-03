import { Explorer } from "view/models/ExplorerModel"

describe("path segments counter", () => {
    test("MUST count unequal", () => {
        const path1 = "Hey.md", path2 = "_unfiltered/lol.md"

        expect(Explorer.countSegments(path1) == Explorer.countSegments(path2)).toBeFalsy() 
    })

    test("MUST count equal", () => { 
        const path1 = "_renamed/count.md", path2 = "_named/count.md"

        expect(Explorer.countSegments(path1) == Explorer.countSegments(path2)).toBeTruthy()
    })
})