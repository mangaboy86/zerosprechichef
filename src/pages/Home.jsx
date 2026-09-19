import React, { useState } from "react";
import { toast } from "sonner";
import { generateRecipe, generateRecipeImage } from "@/lib/api";
import { saveFavorite, isFavorite } from "@/lib/storage";
import { RecipeCard } from "@/components/RecipeCard";
import {
  PANTRY_BASE,
  PORTIONS,
  TIME_FILTERS,
  EQUIPMENT,
  DIETS,
} from "@/lib/constants";
import {
  ChefHat,
  Leaf,
  Clock,
  CookingPot,
  Salad,
  Sparkles,
  Loader2,
} from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxnb3VybWV0JTIwcGxhdGVkJTIwZGlzaCUyMGNoZWYlMjBjb29raW5nJTIwemVybyUyMHdhc3RlJTIwZm9vZHxlbnwwfHx8fDE3ODk1MTMzNTN8MA&ixlib=rb-4.1.0&q=85";

const Chip = ({ active, onClick, children, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-300 ${
      active
        ? "bg-sage text-cream border-sage"
        : "bg-white text-ink-muted border-[#E2DACF] hover:border-sage hover:text-sage"
    }`}
  >
    {children}
  </button>
);

const FieldLabel = ({ icon: Icon, children }) => (
  <label className="flex items-center gap-2 text-sm font-semibold text-ink mb-3">
    <Icon size={16} className="text-terracotta" />
    {children}
  </label>
);

export default function Home() {
  const [ingredients, setIngredients] = useState("");
  const [pantry, setPantry] = useState([...PANTRY_BASE]);
  const [portions, setPortions] = useState("2");
  const [timeFilter, setTimeFilter] = useState(null);
  const [equipment, setEquipment] = useState(["Solo fornelli"]);
  const [diet, setDiet] = useState("Onnivoro");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const togglePantry = (item) =>
    setPantry((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));

  const toggleEquipment = (item) =>
    setEquipment((e) => (e.includes(item) ? e.filter((x) => x !== item) : [...e, item]));

  const buildPayload = () => ({
    ingredients,
    pantry,
    portions,
    time_filter: timeFilter,
    equipment,
    diet,
  });

  const fetchImage = async (data) => {
    setImageLoading(true);
    try {
      const url = await generateRecipeImage({
        recipe_id: data.id,
        title: data.title,
        tagline: data.tagline || "",
      });
      setRecipe((prev) => (prev && prev.id === data.id ? { ...prev, image_url: url } : prev));
    } catch (err) {
      console.warn("Generazione foto piatto non riuscita (opzionale):", err);
    } finally {
      setImageLoading(false);
    }
  };

  const runGeneration = async (isRegen = false) => {
    if (!ingredients.trim()) {
      toast.error("Scrivi cosa hai da smaltire in frigo o dispensa.");
      return;
    }
    isRegen ? setRegenerating(true) : setLoading(true);
    try {
      const data = await generateRecipe(buildPayload());
      setRecipe(data);
      setSaved(isFavorite(data.id));
      fetchImage(data);
      if (!isRegen) {
        setTimeout(
          () => document.getElementById("recipe-result")?.scrollIntoView({ behavior: "smooth" }),
          150
        );
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Errore nella generazione della ricetta.");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleSave = (payload) => {
    const toStore = payload || recipe;
    if (!toStore) return;
    saveFavorite(toStore);
    setRecipe(toStore);
    setSaved(true);
    toast.success("Ricetta salvata nei Preferiti!");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl mb-10 sm:mb-14">
        <img
          src={HERO_IMG}
          alt="Executive chef che impiatta un piatto zero sprechi"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C3531]/90 via-[#2C3531]/55 to-[#2C3531]/25" />
        <div className="relative px-6 sm:px-12 py-14 sm:py-20 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-terracotta-light mb-4">
            <Leaf size={13} /> Cucina anti-spreco d'autore
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-cream leading-tight mb-4">
            Cucina Zero Sprechi con la guida di uno Chef
          </h1>
          <p className="text-base sm:text-lg text-cream/85 leading-relaxed">
            Dimmi cosa rischia di finire nella spazzatura. Un Executive Chef
            selezionerà solo gli ingredienti giusti e ti guiderà, passo dopo
            passo, verso un piatto equilibrato.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="space-y-6">
        <div className="bg-white/90 backdrop-blur-sm border border-[#E2DACF] rounded-2xl shadow-[0_4px_20px_-2px_rgba(44,53,49,0.05)] p-6 sm:p-8">
          <FieldLabel icon={CookingPot}>Cosa hai in frigo o in dispensa da smaltire?</FieldLabel>
          <textarea
            data-testid="ingredients-textarea"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
            placeholder="Es. mezza zucchina appassita, ricotta aperta ieri, due uova, pane raffermo, un limone..."
            className="w-full rounded-xl border border-[#E2DACF] bg-cream/50 p-4 text-base text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-colors duration-300 resize-none"
          />

          {/* Pantry */}
          <div className="mt-7">
            <FieldLabel icon={Sparkles}>I Mai Senza — la tua dispensa base</FieldLabel>
            <p className="text-sm text-ink-muted -mt-2 mb-3">
              Deseleziona ciò che non hai. Lo Chef li considera sempre disponibili.
            </p>
            <div data-testid="pantry-checklist" className="flex flex-wrap gap-2">
              {PANTRY_BASE.map((item) => (
                <Chip
                  key={item}
                  active={pantry.includes(item)}
                  onClick={() => togglePantry(item)}
                  testId={`pantry-${item.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </div>

          {/* Portions */}
          <div className="mt-7" data-testid="portion-selector">
            <FieldLabel icon={ChefHat}>Porzioni</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PORTIONS.map((p) => (
                <Chip
                  key={p}
                  active={portions === p}
                  onClick={() => setPortions(p)}
                  testId={`portion-${p.replace("+", "plus")}`}
                >
                  {p} {p === "1" ? "persona" : "persone"}
                </Chip>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="mt-7">
            <FieldLabel icon={Clock}>Tempo a disposizione</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {TIME_FILTERS.map((t) => (
                <Chip
                  key={t.value}
                  active={timeFilter === t.value}
                  onClick={() => setTimeFilter((cur) => (cur === t.value ? null : t.value))}
                  testId={`time-filter-${t.value}`}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="mt-7">
            <FieldLabel icon={CookingPot}>Attrezzatura</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((e) => (
                <Chip
                  key={e}
                  active={equipment.includes(e)}
                  onClick={() => toggleEquipment(e)}
                  testId={`equipment-${e.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {e}
                </Chip>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div className="mt-7">
            <FieldLabel icon={Salad}>Allergeni & Diete</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => (
                <Chip
                  key={d}
                  active={diet === d}
                  onClick={() => setDiet(d)}
                  testId={`diet-${d.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {d}
                </Chip>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            data-testid="create-recipe-button"
            onClick={() => runGeneration(false)}
            disabled={loading}
            className="mt-8 w-full flex items-center justify-center gap-2.5 bg-sage hover:bg-sage-hover text-cream font-semibold text-lg py-4 rounded-full transition-colors duration-300 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Lo Chef sta creando...
              </>
            ) : (
              <>
                <ChefHat size={20} /> Crea la Ricetta dello Chef
              </>
            )}
          </button>
        </div>
      </section>

      {/* Result */}
      <div id="recipe-result" className="mt-12">
        {loading && !recipe && (
          <div className="flex flex-col items-center gap-3 py-12 text-ink-muted">
            <Loader2 size={32} className="animate-spin text-sage" />
            <p className="font-serif text-lg">Lo Chef sta bilanciando i sapori...</p>
          </div>
        )}
        {recipe && (
          <RecipeCard
            recipe={recipe}
            onSave={handleSave}
            onRegenerate={() => runGeneration(true)}
            isSaved={saved}
            regenerating={regenerating}
            imageLoading={imageLoading}
            onScaled={(r) => {
              setRecipe(r);
              if (saved) saveFavorite(r);
            }}
          />
        )}
      </div>
    </div>
  );
}
