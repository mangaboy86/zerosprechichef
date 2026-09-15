import React from "react";
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
    </div>
  );
};
