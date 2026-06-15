import { Actor } from 'apify';
import { runActorMode } from './core.js';

await Actor.init();

const input = (await Actor.getInput()) || {};
const { mode, items, summary, sampleDataUsed } = await runActorMode(input);
const firstItem = items[0] || null;

for (const item of items) {
    await Actor.pushData(item);
}

await Actor.setValue('OUTPUT', {
    mode,
    resultCount: items.length,
    summary,
    sampleDataUsed,
    dataOrigin: sampleDataUsed ? 'sample_fallback' : 'input_payload',
    authProofLevel: firstItem?.authProofLevel || null,
    workflowReadiness: firstItem?.workflowReadiness || null,
    defaultDatasetUrl: '{{links.apiDefaultDatasetUrl}}/items'
});

await Actor.exit();
