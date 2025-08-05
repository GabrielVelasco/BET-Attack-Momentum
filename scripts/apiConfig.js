// API Configuration
// WARNING: This is a client-side application. In production, consider:
// 1. Using a backend proxy to hide the API key
// 2. Implementing API key rotation
// 3. Setting up proper CORS and request limits

const API_CONFIG = {
    baseUrl: 'https://sportapi7.p.rapidapi.com',
    headers: {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9,pt;q=0.8,pt-BR;q=0.7',
        'csrf-token': 'WvTU646N-iWtzOMSvPpMT8RfZXvlte_6HOl4',
        'priority': 'u=1, i',
        'rapid-client': 'hub-service',
        'x-correlation-id': 'dc3f015a-dbb4-414c-8d19-40c5fd0413e4',
        'x-entity-id': '10893588',
        'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
        'x-rapidapi-key': 'b4b151e2fbmsh0b2dbc04a6a57a7p1b893fjsn15926766fa9e',
        'x-rapidapi-ua': 'RapidAPI-Playground'
    }
};

// // Function to get API configuration with proper API key
// function getApiConfig() {
//     // For client-side apps, the API key needs to be accessible to the browser
//     // In production, consider using environment variables or a backend proxy

//     return {
//         ...API_CONFIG,
//         headers: {
//             ...API_CONFIG.headers,
//             'x-rapidapi-key': apiKey
//         }
//     };
// }

// Helper function to make API requests
async function makeApiRequest(endpoint) {
    return await axios.get(`${API_CONFIG.baseUrl}${endpoint}`, API_CONFIG);
}

export { makeApiRequest };
