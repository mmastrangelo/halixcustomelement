import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageManifest = JSON.parse(
    await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'),
);
const actionSdkManifest = JSON.parse(
    await readFile(resolve(repositoryRoot, 'node_modules/@halix/action-sdk/package.json'), 'utf8'),
);
const esmManifest = JSON.parse(
    await readFile(resolve(repositoryRoot, 'lib/esm/package.json'), 'utf8'),
);

assert.equal(
    actionSdkManifest.version,
    packageManifest.dependencies['@halix/action-sdk'],
    'installed Action SDK must match the exact published dependency',
);
assert.equal(esmManifest.type, 'module', 'ESM output must declare its module boundary');

globalThis.Document = class Document {};

const esmSdk = await import(pathToFileURL(resolve(repositoryRoot, packageManifest.exports['.'].import)));
const require = createRequire(import.meta.url);
const cjsSdk = require(resolve(repositoryRoot, packageManifest.exports['.'].require));

for (const sdk of [esmSdk, cjsSdk]) {
    assert.equal(typeof sdk.HalixLitElement, 'function');
    assert.equal(typeof sdk.initializeContext, 'function');
}

console.log('ESM and CommonJS package entrypoints resolve with the declared Action SDK.');
