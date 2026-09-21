// Set this to the public URL of the deployed Node proxy for the GitHub Pages site.
const DEPLOYED_PROXY_BASE_URL = "https://2b74-2804-4b10-500-fc00-f10a-c60c-495b-a80f.ngrok-free.app";
const DEFAULT_API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3001"
    : DEPLOYED_PROXY_BASE_URL;

const API_HEADERS = {
    "ngrok-skip-browser-warning": "true",
    "Accept": "application/json"
};

function getApiBaseUrl() {
    if (!DEFAULT_API_BASE_URL) {
        throw new Error("Proxy URL is not configured");
    }
    return DEFAULT_API_BASE_URL;
}

async function requestJson(path, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${getApiBaseUrl()}${path}`, {
            headers: API_HEADERS,
            signal: controller.signal
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const message = data?.error || `Request failed with status ${response.status}`;
            throw new Error(message);
        }

        if (!data) throw new Error("Proxy returned invalid JSON");
        return data;
    } finally {
        window.clearTimeout(timeout);
    }
}

function getLiveEventsList() {
    return requestJson("/api/live", 90000);
}

function getSatsFromAPI(matchID) {
    return requestJson(`/api/event/${matchID}/statistics`);
}

export {
    DEFAULT_API_BASE_URL,
    getApiBaseUrl,
    getLiveEventsList,
    getSatsFromAPI
};
