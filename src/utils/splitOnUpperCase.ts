export function splitOnUpperCase(string: string): string[] {
    return string.match(/[A-Z][a-z]+/g) as string[]?? [string];
}