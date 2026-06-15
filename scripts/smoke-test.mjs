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
    threads: [
        {
            threadId: 'thread-1',
            surface: 'marketplace_seller',
            threadUrl: 'https://www.facebook.com/messages/t/thread-1',
            buyerName: 'Clara',
            listingTitle: '1 bed 1 bath Room only',
            city: 'Madrid',
            lastMessage: 'Sigue estando disponible?',
            lastMessageAt: '2026-05-20T12:00:00Z',
            status: 'needs_follow_up'
        },
        {
            threadId: 'thread-2',
            surface: 'messenger_direct',
            threadUrl: 'https://www.facebook.com/messages/e2ee/t/thread-2',
            buyerName: 'Jp Hrez',
            listingTitle: 'Habitacion Madrid',
            lastMessage: 'Como te va el puente?',
            lastMessageAt: '2026-05-19T16:10:00Z',
            status: 'needs_follow_up'
        },
        {
            threadId: 'thread-3',
            surface: 'marketplace_seller',
            buyerName: 'Ana',
            listingTitle: 'iPhone 15 Pro 128GB',
            lastMessage: 'Hola, sigue disponible?',
            hoursSinceLastMessage: 3,
            status: 'new'
        }
    ]
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
