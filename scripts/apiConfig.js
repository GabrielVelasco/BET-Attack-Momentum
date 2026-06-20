const DEFAULT_API_BASE_URL = "https://5e51-2804-4b10-503-1800-1cf4-7112-1055-5fd3.ngrok-free.app";

const API_HEADERS = {
    "ngrok-skip-browser-warning": "true",
    "Accept": "application/json"
};

function getApiBaseUrl() {
    return DEFAULT_API_BASE_URL;
}

async function requestJson(path) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${getApiBaseUrl()}${path}`, {
            headers: API_HEADERS,
            signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data.error || `Request failed with status ${response.status}`;
            throw new Error(message);
        }

        return data;
    } finally {
        window.clearTimeout(timeout);
    }
}

function getLiveEventsList() {
    return requestJson("/api/live");
}

function getSatsFromAPI(matchID) {
    return requestJson(`/api/${matchID}/stats`);
}

export {
    DEFAULT_API_BASE_URL,
    getApiBaseUrl,
    getLiveEventsList,
    getSatsFromAPI
};
