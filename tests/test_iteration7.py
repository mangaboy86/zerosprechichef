"""Iteration 7 backend tests: brigade_secret, wine_pairing, impact fields."""
import os
import pytest
import requests

def _load_url():
    u = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if u:
        return u.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    return ""

BASE_URL = _load_url()
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def generated_recipe():
    payload = {
        "ingredients": "zucchine, pane raffermo, ricotta, limone",
        "pantry": ["Olio EVO", "Sale", "Pepe"],
        "portions": "2",
        "time_filter": "30",
        "equipment": ["Fornelli", "Forno"],
        "diet": "Onnivoro",
    }
    r = requests.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    return r.json()


def test_brigade_secret_present_non_empty(generated_recipe):
    val = generated_recipe.get("brigade_secret")
    assert isinstance(val, str) and val.strip(), f"brigade_secret missing/empty: {val!r}"


def test_wine_pairing_present_non_empty(generated_recipe):
    val = generated_recipe.get("wine_pairing")
    assert isinstance(val, str) and val.strip(), f"wine_pairing missing/empty: {val!r}"


def test_impact_object_shape(generated_recipe):
    impact = generated_recipe.get("impact")
    assert isinstance(impact, dict), f"impact should be dict, got: {type(impact)}"
    assert "food_saved_g" in impact and "savings_eur" in impact
    assert isinstance(impact["food_saved_g"], int), f"food_saved_g must be int, got {type(impact['food_saved_g'])}"
    assert isinstance(impact["savings_eur"], (int, float)) and not isinstance(impact["savings_eur"], bool)


def test_impact_values_positive(generated_recipe):
    impact = generated_recipe["impact"]
    assert impact["food_saved_g"] > 0, f"food_saved_g should be > 0, got {impact['food_saved_g']}"
    assert impact["savings_eur"] > 0, f"savings_eur should be > 0, got {impact['savings_eur']}"
