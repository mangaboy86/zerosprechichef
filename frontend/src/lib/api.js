import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function generateRecipe(payload) {
  const { data } = await axios.post(`${API}/generate-recipe`, payload, {
    timeout: 90000,
  });
  return data;
}
