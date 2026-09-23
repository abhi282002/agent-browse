import type { JsonSafeMetadata } from './workflowTypes';

export const toJsonSafeMetadata = (
  value: Record<string, unknown> | null | undefined,
): JsonSafeMetadata | null => {
  if (!value) return null;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (
        typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean' ||
        entry === null
      ) {
        return [key, entry];
      }

      if (Array.isArray(entry)) {
        return [
          key,
          entry.map((item) =>
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean' ||
            item === null
              ? item
              : typeof item === 'object'
                ? toJsonSafeMetadata(item as Record<string, unknown>)
                : String(item),
          ),
        ];
      }

      if (typeof entry === 'object') {
        return [key, toJsonSafeMetadata(entry as Record<string, unknown>)];
      }

      return [key, String(entry)];
    }),
  );
};
