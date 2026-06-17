const API_CONFIG = {
    baseUrl: 'https://e1a9-2804-4b10-501-e600-fc5f-9557-efe5-b898.ngrok-free.app',
};

// Helper function to make API requests
async function getLiveEventsList() {

    try{
        return await axios.get(`${API_CONFIG.baseUrl}/api/live`);

    }catch (error) {
        console.error(`Error making API request:`, error);
        throw error;
    }
}

async function getSatsFromAPI(matchID) {

    try{
        return await axios.get(`${API_CONFIG.baseUrl}/api/${matchID}/stats`);

    }catch (error) {
        console.error(`Error making API request:`, error);
        throw error;
    }
}

export { getLiveEventsList, getSatsFromAPI };
