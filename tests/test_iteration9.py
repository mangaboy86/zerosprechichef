"""Iteration 9 backend tests: extended impact with co2_saved_kg + water_saved_l."""
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
        "ingredients": "zucchine, pane raffermo, ricotta, limone, prezzemolo",
        "pantry": ["Olio EVO", "Sale", "Pepe"],
        "portions": "2",
        "time_filter": "45",
        "equipment": ["Fornelli", "Forno"],
        "diet": "Onnivoro",
    }
    r = requests.post(f"{API}/generate-recipe", json=payload, timeout=180)
    assert r.status_code == 200, r.text
    return r.json()


def test_impact_has_four_fields(generated_recipe):
    impact = generated_recipe.get("impact")
    assert isinstance(impact, dict)
    for k in ("food_saved_g", "savings_eur", "co2_saved_kg", "water_saved_l"):
        assert k in impact, f"missing {k}: {impact}"


def test_impact_types(generated_recipe):
    impact = generated_recipe["impact"]
    assert isinstance(impact["food_saved_g"], int) and not isinstance(impact["food_saved_g"], bool)
    assert isinstance(impact["savings_eur"], (int, float)) and not isinstance(impact["savings_eur"], bool)
    assert isinstance(impact["co2_saved_kg"], (int, float)) and not isinstance(impact["co2_saved_kg"], bool)
    assert isinstance(impact["water_saved_l"], int) and not isinstance(impact["water_saved_l"], bool)


def test_impact_all_positive(generated_recipe):
    impact = generated_recipe["impact"]
    assert impact["food_saved_g"] > 0, impact
    assert impact["savings_eur"] > 0, impact
    assert impact["co2_saved_kg"] > 0, impact
    assert impact["water_saved_l"] > 0, impact
