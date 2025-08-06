// API Configuration
// WARNING: This is a client-side application. In production, consider:
// 1. Using a backend proxy to hide the API key
// 2. Implementing API key rotation
// 3. Setting up proper CORS and request limits

const REQ_OF_TYPE_LIVE_LIST = "liveList";

const API_CONFIG = {
    baseUrl: 'http://localhost:3000',

    // headers: {
    //     "x-rapidapi-host": "sofascore.p.rapidapi.com",
    //     "x-rapidapi-key": "blablabla",
    //     "x-rapidapi-ua": "RapidAPI-Playground"
    // }
};

// Helper function to make API requests
async function makeApiRequest(reqTypeInfo) {

    try{
        if(reqTypeInfo === REQ_OF_TYPE_LIVE_LIST) { 
            return await axios.get(`${API_CONFIG.baseUrl}/live-events`);

        }else {
            const matchID = reqTypeInfo;
            return await axios.get(`${API_CONFIG.baseUrl}/live-stats/${matchID}`);
        }

    }catch (error) {
        console.error(`Error making API request:`, error);
        throw error;
    }
}

export { makeApiRequest, REQ_OF_TYPE_LIVE_LIST };
