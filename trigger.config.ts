import { defineConfig } from '@trigger.dev/sdk';
import { additionalFiles } from '@trigger.dev/build/extensions/core';
import path from 'path';
import fs from 'fs';

const stagehandZip = path.resolve(
  process.cwd(),
  'node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
);

if (fs.existsSync(stagehandZip)) {
  process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH = stagehandZip;
}

export default defineConfig({
  project: 'proj_otugrrsvhxjlpjgzuaek',

  // Change this from "node" to "node-24"
  runtime: 'node-24',

  logLevel: 'log',

  maxDuration: 3600,

  build: {
    extensions: [
      additionalFiles({
        files: [
          'node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
          'node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node',
        ],
      }),
    ],
  },

  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },

  dirs: ['./trigger'],
});
