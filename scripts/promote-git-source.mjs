import { execSync } from 'node:child_process';
import fs from 'node:fs';

const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
if (!token) throw new Error('APIFY_TOKEN or APIFY_API_TOKEN is required.');

const actorDefinition = JSON.parse(fs.readFileSync('.actor/actor.json', 'utf8'));
const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
const normalizedRemote = remoteUrl.startsWith('git@github.com:')
    ? `https://github.com/${remoteUrl.replace('git@github.com:', '').replace(/\.git$/, '')}.git`
    : remoteUrl;
const gitRepoUrl = `${normalizedRemote}#main`;

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

const updateActor = await api(`/acts/${actorFullName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: actorDefinition.title,
        description: actorDefinition.description,
    }),
});
if (!updateActor.ok) throw new Error(`actor update failed ${updateActor.status}: ${updateActor.text}`);

const updateVersion = await api(`/acts/${actorFullName}/versions/${actorDefinition.version}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        versionNumber: actorDefinition.version,
        sourceType: 'GIT_REPO',
        gitRepoUrl,
        buildTag: actorDefinition.buildTag || 'latest',
    }),
});
if (!updateVersion.ok) throw new Error(`version update failed ${updateVersion.status}: ${updateVersion.text}`);

const build = await api(`/acts/${actorFullName}/builds?version=${encodeURIComponent(actorDefinition.version)}&tag=${encodeURIComponent(actorDefinition.buildTag || 'latest')}&useCache=false`, {
    method: 'POST',
});
if (!build.ok) throw new Error(`build trigger failed ${build.status}: ${build.text}`);

console.log(JSON.stringify({
    actorFullName,
    gitRepoUrl,
    buildId: build.json?.data?.id,
    actorUpdated: true,
    versionUpdated: true,
}, null, 2));
