// API Configuration
// WARNING: This is a client-side application. In production, consider:
// 1. Using a backend proxy to hide the API key
// 2. Implementing API key rotation
// 3. Setting up proper CORS and request limits

const API_CONFIG = {
    baseUrl: 'https://sofascore.p.rapidapi.com',

    headers: {
        "x-rapidapi-host": "sofascore.p.rapidapi.com",
        "x-rapidapi-key": "b4b151e2fbmsh0b2dbc04a6a57a7p1b893fjsn15926766fa9e",
        "x-rapidapi-ua": "RapidAPI-Playground"
    }
};

// Helper function to make API requests
async function makeApiRequest(endpoint) {
    return await axios.get(`${API_CONFIG.baseUrl}${endpoint}`, API_CONFIG);
}

export { makeApiRequest };
