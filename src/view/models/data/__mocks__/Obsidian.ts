export const Obsidian = {
    vault: {
        getRoot: () => ({
            children: [],
        }),
        adapter: {
            stat: jest.fn(),
        },
    },
}