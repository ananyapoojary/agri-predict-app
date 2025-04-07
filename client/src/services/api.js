import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getDataAndPrediction = async (latitude, longitude) => {
  try {
    const response = await axios.post(`${API_URL}/get-data`, {
      latitude,
      longitude
    });
    return response.data;
  } catch (error) {
    console.error('Error in API call:', error);
    throw error;
  }
};
