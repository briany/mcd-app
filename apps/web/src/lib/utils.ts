export const cn = (...inputs: Array<string | false | null | undefined>): string =>
  inputs.filter(Boolean).join(" ");
