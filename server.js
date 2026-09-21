const http = require("node:http");

const UPSTREAM_BASE_URL = "https://www.sofascore.com";
const DEFAULT_ALLOWED_ORIGINS = ["https://gabrielvelasco.github.io"];

function createProxyServer({ fetchImpl = fetch, allowedOrigins = DEFAULT_ALLOWED_ORIGINS } = {}) {
    const allowed = new Set(allowedOrigins);

    return http.createServer(async (request, response) => {
        const origin = request.headers.origin;
        response.setHeader("Vary", "Origin");

        if (origin) {
            const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (!allowed.has(origin) && !localOrigin) {
                response.writeHead(403, { "Content-Type": "application/json" });
                response.end(JSON.stringify({ error: "Origin not allowed" }));
                return;
            }
            response.setHeader("Access-Control-Allow-Origin", origin);
        }

        if (request.method === "OPTIONS") {
            response.writeHead(204, {
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Accept, ngrok-skip-browser-warning"
            });
            response.end();
            return;
        }

        if (request.method !== "GET") {
            response.writeHead(405, { Allow: "GET, OPTIONS" });
            response.end();
            return;
        }

        const pathname = new URL(request.url, "http://localhost").pathname;
        if (pathname === "/health") {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ status: "ok" }));
            return;
        }

        let upstreamPath;

        if (pathname === "/api/live") {
            upstreamPath = "/api/v1/sport/football/events/live";
        } else {
            const match = /^\/api\/event\/(\d+)\/statistics$/.exec(pathname);
            if (match) upstreamPath = `/api/v1/event/${match[1]}/statistics`;
        }

        if (!upstreamPath) {
            response.writeHead(404, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: "Not found" }));
            return;
        }

        try {
            const upstream = await fetchImpl(`${UPSTREAM_BASE_URL}${upstreamPath}`, {
                signal: AbortSignal.timeout(12000)
            });
            const body = Buffer.from(await upstream.arrayBuffer());
            response.writeHead(upstream.status, {
                "Content-Type": upstream.headers.get("content-type") || "application/json",
                "Cache-Control": "no-store"
            });
            response.end(body);
        } catch (error) {
            const timedOut = error.name === "TimeoutError";
            response.writeHead(timedOut ? 504 : 502, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: timedOut ? "SofaScore request timed out" : "SofaScore request failed" }));
        }
    });
}

if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    const additionalOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
    createProxyServer({ allowedOrigins: [...DEFAULT_ALLOWED_ORIGINS, ...additionalOrigins] })
        .listen(port, () => console.log(`SofaScore proxy listening on port ${port}`));
}

module.exports = { createProxyServer };
