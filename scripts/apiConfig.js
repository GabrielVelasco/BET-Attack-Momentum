const API_CONFIG = {
    baseUrl: "https://2db5-2804-4b10-501-e600-b55b-592b-7722-7ac.ngrok-free.app",
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Accept": "application/json"
    }
  };

  // Helper function to make API requests
  async function getLiveEventsList() {
    try {
      return await axios.get(`${API_CONFIG.baseUrl}/api/live`, {
        headers: API_CONFIG.headers
      });
    } catch (error) {
      console.error("Error making API request:", error);
      throw error;
    }
  }

  async function getSatsFromAPI(matchID) {
    try {
      return await axios.get(`${API_CONFIG.baseUrl}/api/${matchID}/stats`, {
        headers: API_CONFIG.headers
      });
    } catch (error) {
      console.error("Error making API request:", error);
      throw error;
    }
  }

  export { getLiveEventsList, getSatsFromAPI };
