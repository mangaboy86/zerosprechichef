import React from "react";
import { toast } from "sonner";
import { buildRecipeText, printRecipe } from "@/lib/share";
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
} from "lucide-react";

const SectionCard = ({ icon: Icon, label, accent = "sage", children, testId }) => (
  <div
    data-testid={testId}
    className="bg-white/90 backdrop-blur-sm border border-[#E2DACF] rounded-2xl shadow-[0_4px_20px_-2px_rgba(44,53,49,0.05)] p-6 sm:p-7 transition-shadow duration-300 hover:shadow-[0_8px_30px_-4px_rgba(44,53,49,0.1)]"
  >
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className={`grid place-items-center w-8 h-8 rounded-lg ${
          accent === "sage" ? "bg-sage-light text-sage" : "bg-terracotta-light text-terracotta"
        }`}
      >
        <Icon size={17} />
      </span>
      <h3 className="font-serif text-xl text-ink">{label}</h3>
    </div>
    {children}
  </div>
);

export const RecipeCard = ({ recipe, onSave, onRegenerate, isSaved, regenerating, hideActions }) => {
  if (!recipe) return null;

  const handleShare = async () => {
    const text = buildRecipeText(recipe);
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
    const ok = printRecipe(recipe);
    if (!ok) toast.error("Abilita i popup per esportare il PDF.");
  };

  return (
    <div data-testid="recipe-card" className="space-y-6 animate-fade-up">
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
        <div className="inline-flex items-center gap-1.5 text-sm text-ink-muted bg-card-alt px-3 py-1 rounded-full">
          <Users size={14} /> Per {recipe.portions} {recipe.portions === "1" ? "persona" : "persone"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard testId="recipe-why-it-works" icon={Sparkles} label="Perché funziona" accent="terracotta">
          <p className="text-base leading-relaxed text-ink">{recipe.why_it_works}</p>
        </SectionCard>

        <SectionCard testId="recipe-mise-en-place" icon={UtensilsCrossed} label="Mise en Place & Dosaggio">
          <ul className="space-y-2.5">
            {recipe.mise_en_place?.map((m, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#E2DACF] pb-2 last:border-0">
                <span className="text-base text-ink font-medium">{m.ingredient}</span>
                <span className="text-sm text-sage font-mono whitespace-nowrap">{m.quantity}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard testId="recipe-brigade-steps" icon={ListOrdered} label="Preparazione da Brigata">
        <ol className="space-y-4">
          {recipe.brigade_steps?.map((s, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-sage text-cream text-sm font-semibold font-mono">
                {i + 1}
              </span>
              <p className="text-base leading-relaxed text-ink pt-0.5">{s}</p>
            </li>
          ))}
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
            {recipe.shopping_list.map((s, i) => (
              <li
                key={i}
                data-testid="shopping-list-item"
                className="flex items-center gap-2.5 bg-terracotta-light rounded-xl px-3.5 py-2.5"
              >
                <span className="grid place-items-center w-5 h-5 rounded-md border-2 border-terracotta/40 shrink-0" />
                <span className="text-sm text-ink font-medium">{s}</span>
              </li>
            ))}
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
          onClick={onSave}
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
    </div>
  );
};
