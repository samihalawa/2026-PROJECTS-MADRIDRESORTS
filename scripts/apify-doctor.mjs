import { execSync } from 'node:child_process';
import fs from 'node:fs';

const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
if (!token) throw new Error('APIFY_TOKEN or APIFY_API_TOKEN is required.');

const actorDefinition = JSON.parse(fs.readFileSync('.actor/actor.json', 'utf8'));
const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();

const api = async (pathname, options = {}) => {
    const response = await fetch(`https://api.apify.com/v2${pathname}${pathname.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`, options);
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* ignore */ }
    return { ok: response.ok, status: response.status, text, json };
};

const me = await api('/users/me');
if (!me.ok) throw new Error(`users/me failed ${me.status}: ${me.text}`);
const username = me.json?.data?.username;
const actorFullName = `${username}~${actorDefinition.name}`;

const actor = await api(`/acts/${actorFullName}`);
if (!actor.ok) throw new Error(`actor fetch failed ${actor.status}: ${actor.text}`);

const version = await api(`/acts/${actorFullName}/versions/${actorDefinition.version}`);
if (!version.ok) throw new Error(`version fetch failed ${version.status}: ${version.text}`);

const builds = await api(`/acts/${actorFullName}/builds?limit=1&desc=1`);
if (!builds.ok) throw new Error(`build list failed ${builds.status}: ${builds.text}`);

const latestBuild = builds.json?.data?.items?.[0] || null;

console.log(JSON.stringify({
    actorFullName,
    remoteUrl,
    actor: {
        id: actor.json?.data?.id,
        title: actor.json?.data?.title,
        description: actor.json?.data?.description,
        modifiedAt: actor.json?.data?.modifiedAt,
    },
    version: {
        versionNumber: version.json?.data?.versionNumber,
        sourceType: version.json?.data?.sourceType,
        gitRepoUrl: version.json?.data?.gitRepoUrl || null,
        buildTag: version.json?.data?.buildTag,
    },
    latestBuild: latestBuild ? {
        id: latestBuild.id,
        number: latestBuild.buildNumber,
        status: latestBuild.status,
        startedAt: latestBuild.startedAt,
        finishedAt: latestBuild.finishedAt,
        gitCommitId: latestBuild.gitCommitId || null,
    } : null,
}, null, 2));
