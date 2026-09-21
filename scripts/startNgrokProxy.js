// Run with `npm run tunnel`. Keep this process running to keep the public API online.
const { spawn, execFileSync } = require("node:child_process");
const { readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const configPath = path.join(projectRoot, "scripts", "apiConfig.js");
const proxyPort = Number(process.env.PROXY_PORT || 3001);
const ngrokApiUrl = "http://127.0.0.1:4040/api/tunnels";
const allowedOrigin = "https://gabrielvelasco.github.io";
const children = [];
let stopping = false;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function stop(exitCode) {
    if (stopping) return;
    stopping = true;
    children.forEach((child) => child.kill("SIGTERM"));
    process.exitCode = exitCode;
    setTimeout(() => process.exit(exitCode), 3000).unref();
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => stop(0));
}

function start(command, args, options = {}) {
    const child = spawn(command, args, {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
        ...options
    });
    children.push(child);
    child.on("error", (error) => {
        console.error(`${command} could not start: ${error.message}`);
        stop(1);
    });
    child.on("exit", (code) => {
        if (!stopping) {
            console.error(`${command} exited unexpectedly with status ${code}`);
            stop(1);
        }
    });
    return child;
}

async function waitForLocalProxy() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
            const response = await fetch(`http://127.0.0.1:${proxyPort}/health`, {
                signal: AbortSignal.timeout(1000)
            });
            if (response.ok) return;
        } catch (_) {
            // The Node process may still be starting.
        }
        await delay(250);
    }
    throw new Error(`Node proxy did not become healthy on port ${proxyPort}`);
}

async function waitForTunnel() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
        try {
            const response = await fetch(ngrokApiUrl, { signal: AbortSignal.timeout(1000) });
            if (response.ok) {
                const { tunnels = [] } = await response.json();
                const tunnel = tunnels.find((item) =>
                    item.public_url?.startsWith("https://") &&
                    item.config?.addr === `http://127.0.0.1:${proxyPort}`
                );
                if (tunnel) return tunnel.public_url.replace(/\/+$/, "");
            }
        } catch (_) {
            // The ngrok agent may still be connecting.
        }
        await delay(250);
    }
    throw new Error("ngrok did not provide a public URL for this proxy");
}

async function verifyTunnel(url) {
    const preflight = await fetch(`${url}/api/live`, {
        method: "OPTIONS",
        headers: {
            Origin: allowedOrigin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "ngrok-skip-browser-warning"
        },
        signal: AbortSignal.timeout(20000)
    });
    if (preflight.status !== 204 ||
        !preflight.headers.get("access-control-allow-headers")?.includes("ngrok-skip-browser-warning")) {
        throw new Error(`Tunnel CORS preflight failed with status ${preflight.status}`);
    }

    const response = await fetch(`${url}/api/live`, {
        headers: {
            Origin: allowedOrigin,
            "ngrok-skip-browser-warning": "true"
        },
        signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok || response.headers.get("access-control-allow-origin") !== allowedOrigin ||
        !Array.isArray(data.events)) {
        throw new Error(`Tunnel live-events check failed with status ${response.status}`);
    }
    console.log(`Verified ${data.events.length} live events through ${url}`);
}

function publishUrl(url) {
    const original = readFileSync(configPath, "utf8");
    const deployedLine = /^const DEPLOYED_PROXY_BASE_URL = ".*";$/m;
    if (!deployedLine.test(original)) throw new Error("Could not find DEPLOYED_PROXY_BASE_URL in apiConfig.js");

    const updated = original
        .replace(deployedLine, `const DEPLOYED_PROXY_BASE_URL = ${JSON.stringify(url)};`)
        .replace(/\? "http:\/\/localhost:\d+"/, `? "http://localhost:${proxyPort}"`);
    if (updated !== original) writeFileSync(configPath, updated);

    execFileSync("git", ["add", "--", "scripts/apiConfig.js"], { cwd: projectRoot });
    const changed = execFileSync("git", ["diff", "--cached", "--name-only", "--", "scripts/apiConfig.js"], {
        cwd: projectRoot,
        encoding: "utf8"
    }).trim();
    if (changed) {
        execFileSync("git", ["commit", "--only", "-m", `Use ngrok proxy at ${url}`, "--", "scripts/apiConfig.js"], {
            cwd: projectRoot,
            stdio: "inherit"
        });
    }
    execFileSync("git", ["push", "origin", "main"], { cwd: projectRoot, stdio: "inherit" });
}

async function main() {
    if (!Number.isInteger(proxyPort) || proxyPort < 1 || proxyPort > 65535) {
        throw new Error("PROXY_PORT must be a valid TCP port");
    }
    const branch = execFileSync("git", ["branch", "--show-current"], {
        cwd: projectRoot,
        encoding: "utf8"
    }).trim();
    if (branch !== "main") throw new Error("Run this script on the main branch");

    try {
        const existingAgent = await fetch(ngrokApiUrl, { signal: AbortSignal.timeout(1000) });
        if (existingAgent.ok) throw new Error("An ngrok agent is already using port 4040; stop it first");
    } catch (error) {
        if (error.message.includes("already using port 4040")) throw error;
    }

    const proxy = start(process.execPath, ["server.js"], {
        env: { ...process.env, PORT: String(proxyPort) }
    });
    proxy.stdout.pipe(process.stdout);
    proxy.stderr.pipe(process.stderr);
    await waitForLocalProxy();

    let ngrokLog = "";
    const ngrok = start("ngrok", ["http", `http://127.0.0.1:${proxyPort}`, "--log=stdout", "--log-format=json"]);
    ngrok.stdout.on("data", (chunk) => { ngrokLog = (ngrokLog + chunk).slice(-8000); });
    ngrok.stderr.on("data", (chunk) => { ngrokLog = (ngrokLog + chunk).slice(-8000); });

    let url;
    try {
        url = await waitForTunnel();
    } catch (error) {
        throw new Error(`${error.message}\n${ngrokLog}`);
    }
    await verifyTunnel(url);
    publishUrl(url);
    console.log(`Frontend now uses ${url}`);
    console.log("Keep this process running. Press Ctrl+C to stop the proxy and tunnel.");
}

main().catch((error) => {
    console.error(error.message);
    stop(1);
});
