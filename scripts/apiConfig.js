const REQ_OF_TYPE_LIVE_LIST = "liveList";

const API_CONFIG = {
    baseUrl: 'https://sc-proxy-16087676324.europe-west1.run.app',

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
