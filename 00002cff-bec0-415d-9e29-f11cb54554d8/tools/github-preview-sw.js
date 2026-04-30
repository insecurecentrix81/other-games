/* eslint-disable no-restricted-globals */
// GitHub Preview Service Worker
//
// Intercepts requests under /.../<this-dir>/gh-preview/<owner>/<repo>/<ref>/<path...>
// and proxies them to either:
//   - https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>            (unauth)
//   - https://api.github.com/repos/<owner>/<repo>/contents/<path>?ref=<ref>    (with PAT)
//
// Multi-path probing per request:
//   - trailing slash:  <p>index.html, <p>index.htm
//   - no trailing slash: <p>, <p>.html, <p>/index.html, <p>/index.htm
//   - empty path (root): index.html, index.htm
//
// MIME type is rewritten based on file extension, since raw.githubusercontent.com
// returns text/plain for HTML/CSS/JS.
//
// Caches responses (positive and negative) per auth-state in the Cache API.

const CACHE_NAME_PUBLIC = 'gh-preview-cache-public-v1';
const CACHE_NAME_AUTH = 'gh-preview-cache-auth-v1';
const PREFIX_MARKER = '/gh-preview/';

let CURRENT_PAT = '';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    const data = event.data || {};
    const port = event.ports && event.ports[0];
    const reply = (msg) => {
        if (port) port.postMessage(msg);
        else if (event.source) event.source.postMessage(msg);
    };

    if (data.type === 'set-pat') {
        CURRENT_PAT = (data.pat || '').trim();
        reply({ type: 'pat-ack', hasPat: !!CURRENT_PAT });
    } else if (data.type === 'clear-cache') {
        event.waitUntil(
            Promise.all([
                caches.delete(CACHE_NAME_PUBLIC),
                caches.delete(CACHE_NAME_AUTH),
            ]).then(() => reply({ type: 'cache-cleared' }))
        );
    } else if (data.type === 'ping') {
        reply({ type: 'pong', hasPat: !!CURRENT_PAT });
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    const idx = url.pathname.indexOf(PREFIX_MARKER);
    if (idx === -1) return;

    const after = url.pathname.slice(idx + PREFIX_MARKER.length);
    if (!after) return;

    event.respondWith(handlePreviewRequest(after));
});

const MIME_BY_EXT = {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    cjs: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    map: 'application/json; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    txt: 'text/plain; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    wasm: 'application/wasm',
    pdf: 'application/pdf',
};

function getMimeType(path) {
    const dot = path.lastIndexOf('.');
    if (dot === -1) return 'application/octet-stream';
    const ext = path.slice(dot + 1).toLowerCase();
    return MIME_BY_EXT[ext] || 'application/octet-stream';
}

function buildCandidates(path, trailingSlash) {
    if (path === '') {
        return ['index.html', 'index.htm'];
    }
    if (trailingSlash) {
        const p = path.replace(/\/+$/, '');
        return [`${p}/index.html`, `${p}/index.htm`];
    }
    return [path, `${path}.html`, `${path}/index.html`, `${path}/index.htm`];
}

function decodeSeg(s) {
    try { return decodeURIComponent(s); } catch { return s; }
}

async function handlePreviewRequest(after) {
    const trailingSlash = after.endsWith('/');
    const rawSegs = after.split('/').filter((s) => s !== '');
    if (rawSegs.length < 3) {
        return synthError(400, 'Bad preview path', 'Expected /gh-preview/<owner>/<repo>/<ref>/<path>');
    }

    const owner = decodeSeg(rawSegs[0]);
    const repo = decodeSeg(rawSegs[1]);
    const ref = decodeSeg(rawSegs[2]);
    const path = rawSegs.slice(3).map(decodeSeg).join('/');

    const candidates = buildCandidates(path, trailingSlash);
    const cacheName = CURRENT_PAT ? CACHE_NAME_AUTH : CACHE_NAME_PUBLIC;
    const cache = await caches.open(cacheName);

    const tried = [];
    let firstAuthErr = null;

    for (const candidate of candidates) {
        tried.push(candidate);
        const cacheKey = makeCacheKey(owner, repo, ref, candidate);

        const cached = await cache.match(cacheKey);
        if (cached) {
            const status = cached.headers.get('x-ghpv-status');
            if (status === 'hit') {
                return rebuildResponse(await cached.arrayBuffer(), candidate, 200);
            }
            if (status === 'miss') {
                continue;
            }
        }

        const result = await fetchFromGitHub(owner, repo, ref, candidate);

        if (result.ok) {
            const buf = await result.response.arrayBuffer();
            const cacheResp = new Response(buf, {
                status: 200,
                headers: { 'x-ghpv-status': 'hit' },
            });
            await cache.put(cacheKey, cacheResp);
            return rebuildResponse(buf, candidate, 200);
        }

        if (result.status === 404) {
            const negResp = new Response('', {
                status: 200,
                headers: { 'x-ghpv-status': 'miss' },
            });
            await cache.put(cacheKey, negResp);
            continue;
        }

        if (result.status === 401 || result.status === 403) {
            firstAuthErr = firstAuthErr || result;
            // Don't keep probing; auth failures or rate limit shouldn't be amplified
            return synthError(
                result.status,
                result.status === 401 ? 'Unauthorized' : 'Forbidden / rate limit',
                explainAuthFailure(result),
            );
        }

        // Other errors (5xx, network) — bubble up
        return synthError(result.status || 502, result.statusText || 'Upstream error', result.bodyText || '');
    }

    return synthError(
        404,
        'Not Found',
        `Tried the following paths against ${owner}/${repo}@${ref}:\n  - ${tried.join('\n  - ')}\n\nNone existed. ` +
        `Check the URL, ref, or that you have access (PAT) to a private repository.`,
    );
}

function makeCacheKey(owner, repo, ref, path) {
    // synthetic URL for Cache API keying; avoids colliding with real upstream URLs
    const encPath = path.split('/').map(encodeURIComponent).join('/');
    return new Request(
        `https://gh-preview.local/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/${encPath}`
    );
}

async function fetchFromGitHub(owner, repo, ref, path) {
    const encOwner = encodeURIComponent(owner);
    const encRepo = encodeURIComponent(repo);
    const encPath = path.split('/').map(encodeURIComponent).join('/');

    if (CURRENT_PAT) {
        const url = `https://api.github.com/repos/${encOwner}/${encRepo}/contents/${encPath}?ref=${encodeURIComponent(ref)}`;
        try {
            const resp = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.raw',
                    'Authorization': `Bearer ${CURRENT_PAT}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            });
            if (resp.ok) return { ok: true, response: resp, status: 200 };
            const bodyText = await safeReadText(resp);
            return {
                ok: false,
                status: resp.status,
                statusText: resp.statusText,
                bodyText,
                rateLimit: extractRateLimit(resp),
            };
        } catch (e) {
            return { ok: false, status: 0, statusText: 'Network error', bodyText: String((e && e.message) || e) };
        }
    } else {
        // raw.githubusercontent.com supports refs with slashes only via "refs/heads/<ref>" form,
        // but for simple branch names the bare form works. Try the bare form first.
        const url = `https://raw.githubusercontent.com/${encOwner}/${encRepo}/${encodeURIComponent(ref)}/${encPath}`;
        try {
            const resp = await fetch(url);
            if (resp.ok) return { ok: true, response: resp, status: 200 };
            const bodyText = await safeReadText(resp);
            return { ok: false, status: resp.status, statusText: resp.statusText, bodyText };
        } catch (e) {
            return { ok: false, status: 0, statusText: 'Network error', bodyText: String((e && e.message) || e) };
        }
    }
}

async function safeReadText(resp) {
    try {
        const t = await resp.text();
        return t.length > 4000 ? t.slice(0, 4000) + '... [truncated]' : t;
    } catch { return ''; }
}

function extractRateLimit(resp) {
    return {
        remaining: resp.headers.get('x-ratelimit-remaining'),
        limit: resp.headers.get('x-ratelimit-limit'),
        reset: resp.headers.get('x-ratelimit-reset'),
    };
}

function explainAuthFailure(result) {
    const lines = [];
    if (result.status === 401) {
        lines.push('GitHub returned 401. Your personal access token is missing, expired, or invalid.');
    } else if (result.status === 403) {
        lines.push('GitHub returned 403. This is usually one of:');
        lines.push('  • Rate limit exceeded (60/hr unauthenticated, 5000/hr authenticated)');
        lines.push('  • PAT lacks the necessary scope/permissions for this repo');
        lines.push('  • Resource is hidden behind SSO that the PAT has not been authorized for');
        if (result.rateLimit && result.rateLimit.remaining === '0') {
            const resetMs = result.rateLimit.reset ? Number(result.rateLimit.reset) * 1000 : 0;
            const resetIso = resetMs ? new Date(resetMs).toISOString() : 'unknown';
            lines.push(`  Rate limit exhausted. Resets at ${resetIso}.`);
        }
    }
    lines.push('');
    lines.push('Upstream body:');
    lines.push(result.bodyText || '(empty)');
    return lines.join('\n');
}

function rebuildResponse(arrayBuffer, path, status) {
    const mime = getMimeType(path);
    const headers = new Headers();
    headers.set('Content-Type', mime);
    headers.set('Cache-Control', 'no-store');
    return new Response(arrayBuffer, { status, headers });
}

function synthError(status, statusText, bodyText) {
    const body = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${status} ${escapeHtml(statusText)}</title>
<style>
body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#1e1e1e;color:#d4d4d4;padding:24px;margin:0;line-height:1.5}
h1{color:#f48771;margin:0 0 8px;font-weight:500}
.code{font-family:'Fira Code',monospace;color:#888;font-size:12px;margin-bottom:18px}
pre{background:#2d2d2d;padding:14px;border-radius:4px;border:1px solid #3c3c3c;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:'Fira Code',monospace;font-size:12px}
</style>
</head><body>
<h1>${status} ${escapeHtml(statusText)}</h1>
<div class="code">github-preview service worker</div>
<pre>${escapeHtml(bodyText || '(no body)')}</pre>
</body></html>`;
    return new Response(body, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}
