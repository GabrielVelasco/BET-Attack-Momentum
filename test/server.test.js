const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createProxyServer } = require("../server.js");

test("forwards only the two supported SofaScore routes", async () => {
    const upstreamUrls = [];
    const server = createProxyServer({
        fetchImpl: async (url) => {
            upstreamUrls.push(url);
            return new Response(JSON.stringify({ ok: true }), {
                headers: { "Content-Type": "application/json" }
            });
        }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const live = await fetch(`${baseUrl}/api/live`);
        const stats = await fetch(`${baseUrl}/api/event/12345/statistics`);
        const health = await fetch(`${baseUrl}/health`);
        const invalid = await fetch(`${baseUrl}/api/event/not-an-id/statistics`);

        assert.equal(live.status, 200);
        assert.deepEqual(await live.json(), { ok: true });
        assert.equal(stats.status, 200);
        assert.deepEqual(await health.json(), { status: "ok" });
        assert.equal(invalid.status, 404);
        assert.deepEqual(upstreamUrls, [
            "https://www.sofascore.com/api/v1/sport/football/events/live",
            "https://www.sofascore.com/api/v1/event/12345/statistics"
        ]);
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
});

test("allows the GitHub Pages origin and rejects other browser origins", async () => {
    let upstreamCalls = 0;
    const server = createProxyServer({
        fetchImpl: async () => {
            upstreamCalls += 1;
            return new Response("{}", { headers: { "Content-Type": "application/json" } });
        }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
        const url = `http://127.0.0.1:${server.address().port}/api/live`;
        const allowed = await fetch(url, { headers: { Origin: "https://gabrielvelasco.github.io" } });
        const forbidden = await fetch(url, { headers: { Origin: "https://other.example" } });

        assert.equal(allowed.status, 200);
        assert.equal(allowed.headers.get("access-control-allow-origin"), "https://gabrielvelasco.github.io");
        assert.equal(forbidden.status, 403);
        assert.equal(upstreamCalls, 1);
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
});

test("preserves an upstream error status and body", async () => {
    const server = createProxyServer({
        fetchImpl: async () => new Response(JSON.stringify({ error: "Upstream refused request" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        })
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/live`);
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), { error: "Upstream refused request" });
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
});
