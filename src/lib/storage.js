const KEY = "zsc_favorites";

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveFavorite(recipe) {
  const favs = getFavorites();
  if (favs.some((r) => r.id === recipe.id)) return favs;
  const updated = [{ ...recipe, savedAt: new Date().toISOString() }, ...favs];
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function removeFavorite(id) {
  const updated = getFavorites().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export function isFavorite(id) {
  return getFavorites().some((r) => r.id === id);
}

const COOKIE_KEY = "zsc_cookie_consent";
export function getCookieConsent() {
  return localStorage.getItem(COOKIE_KEY);
}
export function setCookieConsent(value) {
  localStorage.setItem(COOKIE_KEY, value);
}
