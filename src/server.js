import { createServer } from 'node:http';
import { runActorMode, withDefaultCookies } from './core.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const API_TOKEN = (process.env.FACEBOOK_MARKET_API_TOKEN || process.env.API_TOKEN || '').trim();

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
    });
    res.end(JSON.stringify(payload, null, 2));
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 5 * 1024 * 1024) {
                reject(new Error('Request body exceeded 5 MB.'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function isAuthorized(req) {
    if (!API_TOKEN) return true;
    const authHeader = String(req.headers.authorization || '');
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
    const headerToken = String(req.headers['x-api-key'] || '').trim();
    return bearerToken === API_TOKEN || headerToken === API_TOKEN;
}

function parseJsonBody(body) {
    if (!body.trim()) return {};
    return JSON.parse(body);
}

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

        if (url.pathname === '/health') {
            return sendJson(res, 200, {
                ok: true,
                runtime: 'server',
                service: 'facebook-marketplace-seller-manager',
            });
        }

        if (req.method === 'GET' && url.pathname === '/modes') {
            return sendJson(res, 200, {
                modes: [
                    'conversation_inventory',
                    'build_reply_queue',
                    'build_follow_up_queue',
                    'listing_ops_plan',
                    'fetch_live_seller_threads',
                    'send_reply',
                    'session_audit',
                ],
                supportsDefaultCookiesEnv: true,
                supportsBrowserCdpUrl: true,
            });
        }

        if (req.method !== 'POST' || !['/run', '/api/run'].includes(url.pathname)) {
            return sendJson(res, 404, {
                ok: false,
                error: 'Not found.',
                supportedRoutes: ['GET /health', 'GET /modes', 'POST /run', 'POST /api/run'],
            });
        }

        if (!isAuthorized(req)) {
            return sendJson(res, 401, {
                ok: false,
                error: 'Unauthorized.',
            });
        }

        const rawBody = await readRequestBody(req);
        const input = withDefaultCookies(parseJsonBody(rawBody));
        const output = await runActorMode(input);

        return sendJson(res, 200, {
            ok: true,
            runtime: 'server',
            ...output,
        });
    } catch (error) {
        return sendJson(res, 500, {
            ok: false,
            error: error.message || String(error),
        });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`facebook-marketplace-seller-manager listening on http://${HOST}:${PORT}`);
});
