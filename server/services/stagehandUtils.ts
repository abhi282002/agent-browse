import path from 'path';
import fs from 'fs';

/**
 * Resolves and verifies the local Stagehand extension zip archive path.
 * Sets process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH for headless Chromium environments.
 */
export function ensureStagehandExtensionPath(): string | undefined {
  if (
    process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH &&
    fs.existsSync(process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH)
  ) {
    return process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH;
  }

  const candidatePaths = [
    path.resolve(
      process.cwd(),
      'node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    path.resolve(
      __dirname,
      '../../node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    path.resolve(
      __dirname,
      '../node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    'C:\\agentbrowse\\node_modules\\@browserbasehq\\stagehand\\dist\\assets\\stagehand-extension.zip',
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH = candidate;
      return candidate;
    }
  }

  return undefined;
}
