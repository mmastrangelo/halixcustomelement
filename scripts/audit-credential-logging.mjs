import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const credentialLogPattern = /console\.(?:debug|error|info|log|warn)\([^\n]*(?:auth(?:entication)?token|accessToken|authorization|bearer)/i;
const scanRoots = [
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'node_modules', '@halix', 'action-sdk', 'lib'),
];

async function sourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return sourceFiles(entryPath);
        }
        return /\.(?:js|mjs|ts)$/.test(entry.name) ? [entryPath] : [];
    }));
    return files.flat();
}

const findings = [];
for (const scanRoot of scanRoots) {
    for (const filePath of await sourceFiles(scanRoot)) {
        const contents = await readFile(filePath, 'utf8');
        if (credentialLogPattern.test(contents)) {
            findings.push(path.relative(projectRoot, filePath));
        }
    }
}

if (findings.length > 0) {
    throw new Error(`Credential-bearing logging found in: ${findings.join(', ')}`);
}

console.log('Credential logging audit passed for the custom-element SDK and installed Action SDK.');
