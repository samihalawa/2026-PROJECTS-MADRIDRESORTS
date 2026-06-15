import fs from 'node:fs';
import { runActorMode } from '../src/core.js';

const readInput = () => {
    const file = process.argv[2];
    if (file) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    const stdin = fs.readFileSync(0, 'utf8').trim();
    return stdin ? JSON.parse(stdin) : {};
};

const input = readInput();
const result = runActorMode(input);

process.stdout.write(`${JSON.stringify({
    mode: result.mode,
    resultCount: result.items.length,
    summary: result.summary,
    items: result.items,
}, null, 2)}\n`);
