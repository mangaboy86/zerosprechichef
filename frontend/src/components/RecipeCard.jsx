import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { buildRecipeText, printRecipe } from "@/lib/share";
import { scaleRecipe, mediaUrl } from "@/lib/api";
import { PORTIONS } from "@/lib/constants";
import { StepTimer, extractMinutes } from "@/components/StepTimer";
import { CookMode } from "@/components/CookMode";
import {
  Sparkles,
  UtensilsCrossed,
  ListOrdered,
  Wand2,
  Archive,
  Heart,
  RefreshCw,
  Info,
  Users,
  Check,
  Recycle,
  ShoppingBasket,
  Share2,
  FileDown,
  Loader2,
  Tag,
  ArrowLeftRight,
  ChefHat,
} from "lucide-react";
const SectionCard = ({ icon: Icon, label, accent = "sage", children, testId, action }) => (
  <div
    data-testid={testId}
    className="bg-white/90 backdrop-blur-sm border border-[#E2DACF] rounded-2xl shadow-[0_4px_20px_-2px_rgba(44,53,49,0.05)] p-6 sm:p-7 transition-shadow duration-300 hover:shadow-[0_8px_30px_-4px_rgba(44,53,49,0.1)]"
  >
    <div className="flex items-center justify-between gap-2.5 mb-4">
      <div className="flex items-center gap-2.5">
        <span
          className={`grid place-items-center w-8 h-8 rounded-lg ${
            accent === "sage" ? "bg-sage-light text-sage" : "bg-terracotta-light text-terracotta"
          }`}
        >
          <Icon size={17} />
        </span>
        <h3 className="font-serif text-xl text-ink">{label}</h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);

export const RecipeCard = ({
  recipe,
  onSave,
  onRegenerate,
  isSaved,
  regenerating,
  hideActions,
  onScaled,
  imageLoading,
  onCookMode,
}) => {
  const [mise, setMise] = useState(recipe?.mise_en_place || []);
  const [portions, setPortions] = useState(recipe?.portions || "2");
  const [scaling, setScaling] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cookMode, setCookMode] = useState(false);

  useEffect(() => {
    setMise(recipe?.mise_en_place || []);
    setPortions(recipe?.portions || "2");
    setImgError(false);
  }, [recipe?.id]);

  useEffect(() => {
    // reflect image arriving after async generation
    setImgError(false);
  }, [recipe?.image_url]);

  if (!recipe) return null;

  const handleScale = async (target) => {
    if (target === portions || scaling) return;
    setScaling(true);
    try {
      const newMise = await scaleRecipe({
        mise_en_place: mise,
        from_portions: portions,
        to_portions: target,
      });
      setMise(newMise);
      setPortions(target);
      onScaled?.({ ...recipe, mise_en_place: newMise, portions: target });
    } catch (e) {
      toast.error("Impossibile ricalcolare le dosi.");
    } finally {
      setScaling(false);
    }
  };

  const handleShare = async () => {
    const text = buildRecipeText({ ...recipe, mise_en_place: mise, portions });
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, text });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Ricetta copiata negli appunti!");
    } catch {
      toast.error("Impossibile condividere la ricetta.");
    }
  };

  const handlePrint = () => {
    const ok = printRecipe({ ...recipe, mise_en_place: mise, portions });
    if (!ok) toast.error("Abilita i popup per esportare il PDF.");
  };

  const showImage = imageLoading || (recipe.image_url && !imgError);

  return (
    <div data-testid="recipe-card" className="space-y-6 animate-fade-up">
      {/* Dish photo */}
      {showImage && (
        <div
          data-testid="recipe-image"
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E2DACF] bg-card-alt aspect-[16/10] sm:aspect-[16/9]"
        >
          {recipe.image_url && !imgError ? (
            <img
              src={mediaUrl(recipe.image_url)}
              alt={recipe.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover animate-fade-up"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2 text-ink-muted">
                <Loader2 size={26} className="animate-spin text-sage" />
                <span className="text-sm font-serif">Lo Chef sta impiattando la foto...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Title header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-terracotta">
          <Sparkles size={13} /> La ricetta dello Chef
        </span>
        <h2 data-testid="recipe-title" className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
          {recipe.title}
        </h2>
        {recipe.tagline && (
          <p className="text-base text-ink-muted italic font-serif">{recipe.tagline}</p>
        )}
        <div className="flex items-center justify-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted bg-card-alt px-3 py-1 rounded-full">
            <Users size={14} /> Per {portions} {portions === "1" ? "persona" : "persone"}
          </span>
          {recipe.category && (
            <span data-testid="recipe-category" className="inline-flex items-center gap-1.5 text-sm text-sage bg-sage-light px-3 py-1 rounded-full">
              <Tag size={13} /> {recipe.category}
            </span>
          )}
        </div>
      </div>

      <button
        data-testid="cook-mode-button"
        onClick={() =>
          onCookMode
            ? onCookMode({ ...recipe, mise_en_place: mise, portions })
            : setCookMode(true)
        }
        className="w-full flex items-center justify-center gap-2.5 bg-ink text-cream font-semibold py-3.5 rounded-full hover:bg-ink/90 transition-colors duration-300"
      >
        <ChefHat size={19} /> Avvia Modalità Cucina
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard testId="recipe-why-it-works" icon={Sparkles} label="Perché funziona" accent="terracotta">
          <p className="text-base leading-relaxed text-ink">{recipe.why_it_works}</p>
        </SectionCard>

        <SectionCard
          testId="recipe-mise-en-place"
          icon={UtensilsCrossed}
          label="Mise en Place & Dosaggio"
          action={
            <div data-testid="portion-scaler" className="flex items-center gap-1 bg-cream rounded-full p-1 border border-[#E2DACF]">
              {PORTIONS.map((p) => (
                <button
                  key={p}
                  data-testid={`scale-portion-${p.replace("+", "plus")}`}
                  onClick={() => handleScale(p)}
                  disabled={scaling}
                  className={`w-7 h-7 rounded-full text-xs font-semibold transition-colors duration-300 ${
                    portions === p
                      ? "bg-sage text-cream"
                      : "text-ink-muted hover:bg-sage-light hover:text-sage"
                  } disabled:opacity-50`}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        >
          <ul className={`space-y-2.5 transition-opacity duration-300 ${scaling ? "opacity-40" : ""}`}>
            {mise.map((m, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#E2DACF] pb-2 last:border-0">
                <span className="text-base text-ink font-medium">{m.ingredient}</span>
                <span data-testid="mise-quantity" className="text-sm text-sage font-mono whitespace-nowrap">{m.quantity}</span>
              </li>
            ))}
          </ul>
          {scaling && (
            <div className="flex items-center gap-2 text-sm text-sage mt-3">
              <Loader2 size={14} className="animate-spin" /> Ricalcolo le dosi...
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard testId="recipe-brigade-steps" icon={ListOrdered} label="Preparazione da Brigata">
        <ol className="space-y-4">
          {recipe.brigade_steps?.map((s, i) => {
            const mins = extractMinutes(s);
            return (
              <li key={i} className="flex gap-3.5">
                <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-sage text-cream text-sm font-semibold font-mono">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <p className="text-base leading-relaxed text-ink">{s}</p>
                  {mins ? <StepTimer minutes={mins} label={`Passo ${i + 1}`} /> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </SectionCard>

      <SectionCard testId="recipe-chef-touch" icon={Wand2} label="Il Tocco da Chef" accent="terracotta">
        <p className="text-base leading-relaxed text-ink">{recipe.chef_touch}</p>
      </SectionCard>

      {recipe.scrap_tip && (
        <SectionCard testId="recipe-scrap-tip" icon={Recycle} label="Recupero Bucce & Scarti">
          <p className="text-base leading-relaxed text-ink">{recipe.scrap_tip}</p>
        </SectionCard>
      )}

      {recipe.shopping_list?.length > 0 && (
        <SectionCard testId="recipe-shopping-list" icon={ShoppingBasket} label="Lista della Spesa" accent="terracotta">
          <p className="text-sm text-ink-muted mb-4">
            Ti serve giusto un tocco in più per completare il piatto:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipe.shopping_list.map((s, i) => {
              const norm = (v) =>
                (v || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const ns = norm(s);
              const sub = recipe.substitutions?.find((x) => {
                const nx = norm(x.ingredient);
                return nx === ns || nx.includes(ns) || ns.includes(nx);
              });
              return (
                <li
                  key={i}
                  data-testid="shopping-list-item"
                  className="bg-terracotta-light rounded-xl px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid place-items-center w-5 h-5 rounded-md border-2 border-terracotta/40 shrink-0" />
                    <span className="text-sm text-ink font-medium">{s}</span>
                  </div>
                  {sub?.substitute && (
                    <div
                      data-testid="substitution-hint"
                      className="flex items-start gap-1.5 mt-1.5 ml-7 text-xs text-ink-muted"
                    >
                      <ArrowLeftRight size={12} className="text-terracotta shrink-0 mt-0.5" />
                      <span>
                        Non ce l'hai? Prova con <span className="font-semibold text-terracotta">{sub.substitute}</span>
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      {recipe.excluded_ingredients?.length > 0 && (
        <SectionCard testId="recipe-pantry-leftovers" icon={Archive} label="I rimasti in dispensa">
          <p className="text-sm text-ink-muted mb-4">
            Alcuni ingredienti sono stati messi da parte con criterio. Ecco perché:
          </p>
          <ul className="space-y-3">
            {recipe.excluded_ingredients.map((x, i) => (
              <li key={i} className="bg-card-alt rounded-xl p-4">
                <span className="font-semibold text-ink block mb-1">{x.ingredient}</span>
                <span className="text-sm text-ink-muted leading-relaxed">{x.reason}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Allergen disclaimer */}
      <div className="flex items-start gap-3 bg-terracotta-light border border-terracotta/30 rounded-2xl p-4">
        <Info size={18} className="text-terracotta shrink-0 mt-0.5" />
        <p className="text-sm text-ink leading-relaxed">{recipe.allergen_disclaimer}</p>
      </div>

      {/* Actions */}
      {!hideActions && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <button
            data-testid="save-favorite-button"
            onClick={() => onSave?.({ ...recipe, mise_en_place: mise, portions })}
            disabled={isSaved}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors duration-300 ${
              isSaved
                ? "bg-sage-light text-sage cursor-default"
                : "bg-sage text-cream hover:bg-sage-hover"
            }`}
          >
            {isSaved ? <Check size={18} /> : <Heart size={18} />}
            {isSaved ? "Salvata nei Preferiti" : "Salva nei Preferiti"}
          </button>
          <button
            data-testid="generate-another-button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold border-2 border-sage text-sage hover:bg-sage-light transition-colors duration-300 disabled:opacity-60"
          >
            <RefreshCw size={18} className={regenerating ? "animate-spin-slow" : ""} />
            {regenerating ? "Lo Chef ci pensa..." : "Proponi un'altra ricetta"}
          </button>
        </div>
      )}

      {/* Share / Export (always visible) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <button
          data-testid="share-recipe-button"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold border-2 border-terracotta text-terracotta hover:bg-terracotta-light transition-colors duration-300"
        >
          <Share2 size={18} /> Condividi
        </button>
        <button
          data-testid="export-pdf-button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold border-2 border-terracotta text-terracotta hover:bg-terracotta-light transition-colors duration-300"
        >
          <FileDown size={18} /> Esporta PDF
        </button>
      </div>

      {!onCookMode && (
        <CookMode
          recipe={{ ...recipe, mise_en_place: mise, portions }}
          open={cookMode}
          onClose={() => setCookMode(false)}
        />
      )}
    </div>
  );
};
