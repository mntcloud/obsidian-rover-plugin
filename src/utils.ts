export function log(...args: unknown[]) {
  console.log(
    "%c ROVER ",
    "background-color: orange; color: black; font-weight: 600;",
    ...args,
  );
}

export function logError(...args: unknown[]) {
  console.error(
    "%c ROVER ",
    "background-color: crimson; color: black; font-weight: 600;",
    ...args,
  );
}
