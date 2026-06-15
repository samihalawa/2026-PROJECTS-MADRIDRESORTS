import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const runDir = mkdtempSync(join(tmpdir(), 'fb-marketplace-actor-'));
const kvDir = join(runDir, 'key_value_stores', 'default');
const datasetDir = join(runDir, 'datasets', 'default');

mkdirSync(kvDir, { recursive: true });
mkdirSync(datasetDir, { recursive: true });

const input = {
    mode: 'build_follow_up_queue',
    replyStyle: 'concise_friendly',
    followUpDaysThreshold: 20,
};

writeFileSync(join(kvDir, 'INPUT.json'), JSON.stringify(input, null, 2));

execFileSync('node', ['src/main.js'], {
    cwd: process.cwd(),
    env: {
        ...process.env,
        CRAWLEE_STORAGE_DIR: runDir,
        APIFY_LOCAL_STORAGE_DIR: runDir,
        APIFY_TOKEN: '',
    },
    stdio: 'inherit'
});

const output = JSON.parse(readFileSync(join(kvDir, 'OUTPUT.json'), 'utf8'));
const datasetItems = [
    JSON.parse(readFileSync(join(datasetDir, '000000001.json'), 'utf8')),
    JSON.parse(readFileSync(join(datasetDir, '000000002.json'), 'utf8')),
];

if (output.mode !== 'build_follow_up_queue') {
    throw new Error(`Expected mode build_follow_up_queue, got ${output.mode}`);
}

if (datasetItems.length !== 2) {
    throw new Error(`Expected 2 follow-up rows, got ${datasetItems.length}`);
}

if (!datasetItems.every((item) => item.followUpWindowReached === true)) {
    throw new Error('Expected every dataset row to be a follow-up candidate.');
}

if (!datasetItems.some((item) => item.surface === 'messenger_direct')) {
    throw new Error('Expected one messenger_direct follow-up row.');
}

if (!datasetItems.every((item) => item.sampleDataUsed === true)) {
    throw new Error('Expected sampleDataUsed on smoke-test rows.');
}

console.log('Smoke test passed.');
console.log(JSON.stringify({
    outputSummary: output.summary,
    datasetPreview: datasetItems.map((item) => ({
        threadId: item.threadId,
        surface: item.surface,
        recommendedAction: item.recommendedAction,
        daysSinceLastMessage: item.daysSinceLastMessage
    }))
}, null, 2));
