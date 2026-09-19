import axios from "axios";
const API_BASE_URL = "https://zerosprechichef.onrender.com";
export async function generateRecipe(payload) { const response = await axios.post(`${API_BASE_URL}/generate-recipe`, payload); return response.data; } export async function scaleRecipe(payload) { return payload; } export async function generateRecipeImage(payload) { return ""; } export const mediaUrl = "";
