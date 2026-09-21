export function pickFirstString(...args: unknown[]): string {
  for (const arg of args) {
    const trimmed = (arg as string)?.trim();

    if (trimmed?.length > 0) {
      return trimmed;
    }
  }

  return '';
}
