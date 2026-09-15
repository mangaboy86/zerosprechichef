import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const mediaUrl = (path) => (path?.startsWith("http") ? path : `${BACKEND_URL}${path}`);

export async function generateRecipe(payload) {
  const { data } = await axios.post(`${API}/generate-recipe`, payload, {
    timeout: 90000,
  });
  return data;
}

export async function scaleRecipe(payload) {
  const { data } = await axios.post(`${API}/scale-recipe`, payload, {
    timeout: 60000,
  });
  return data.mise_en_place;
}

export async function generateRecipeImage(payload) {
  const { data } = await axios.post(`${API}/recipe-image`, payload, {
    timeout: 90000,
  });
  return data.image_url;
}
