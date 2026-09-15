import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getFavorites, removeFavorite } from "@/lib/storage";
import { mediaUrl } from "@/lib/api";
import { RecipeCard } from "@/components/RecipeCard";
import { DIETS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Heart, Trash2, BookOpen, Users, ChefHat, Search, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [dietFilter, setDietFilter] = useState("Tutte");

  useEffect(() => {
    setFavs(getFavorites());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return favs.filter((r) => {
      const matchDiet = dietFilter === "Tutte" || r.diet === dietFilter;
      const matchText =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.tagline?.toLowerCase().includes(q) ||
        r.mise_en_place?.some((m) => m.ingredient?.toLowerCase().includes(q));
      return matchDiet && matchText;
    });
  }, [favs, query, dietFilter]);

  const CATEGORY_ORDER = [
    "Antipasto",
    "Primo Piatto",
    "Secondo Piatto",
    "Contorno",
    "Zuppa",
    "Piatto Unico",
    "Dolce",
    "Colazione",
  ];

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const cat = r.category || "Altre ricette";
      (map[cat] = map[cat] || []).push(r);
    });
    return Object.entries(map).sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a[0]);
      const ib = CATEGORY_ORDER.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [filtered]);

  const handleRemove = (id, e) => {
    e?.stopPropagation();
    setFavs(removeFavorite(id));
    if (selected?.id === id) setSelected(null);
    toast.success("Ricetta rimossa dai Preferiti.");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-terracotta mb-3">
          <Heart size={13} /> Salvate sul tuo dispositivo
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
          Le tue ricette preferite
        </h1>
        <p className="text-base text-ink-muted mt-2">
          Consultabili anche offline. Tutto resta in locale, sul tuo device.
        </p>
      </div>

      {favs.length > 0 && (
        <div className="mb-8 flex flex-col gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              data-testid="favorites-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nome o ingrediente..."
              className="w-full rounded-full border border-[#E2DACF] bg-white pl-11 pr-4 py-3 text-base text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-colors duration-300"
            />
          </div>
          <div className="flex flex-wrap gap-2" data-testid="favorites-diet-filter">
            {["Tutte", ...DIETS].map((d) => (
              <button
                key={d}
                data-testid={`favorites-diet-${d.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setDietFilter(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-300 ${
                  dietFilter === d
                    ? "bg-sage text-cream border-sage"
                    : "bg-white text-ink-muted border-[#E2DACF] hover:border-sage hover:text-sage"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {favs.length === 0 ? (
        <div
          data-testid="favorites-empty-state"
          className="bg-white/90 border border-[#E2DACF] rounded-3xl p-10 sm:p-16 text-center"
        >
          <span className="grid place-items-center w-16 h-16 mx-auto rounded-2xl bg-sage-light text-sage mb-5">
            <BookOpen size={30} />
          </span>
          <h2 className="font-serif text-2xl text-ink mb-2">Nessuna ricetta salvata</h2>
          <p className="text-ink-muted max-w-sm mx-auto mb-6">
            Genera la tua prima ricetta anti-spreco e salvala qui per ritrovarla
            quando vuoi.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-sage hover:bg-sage-hover text-cream font-semibold px-6 py-3 rounded-full transition-colors duration-300"
          >
            <ChefHat size={18} /> Crea una ricetta
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-testid="favorites-no-results"
          className="bg-white/90 border border-[#E2DACF] rounded-3xl p-10 sm:p-14 text-center"
        >
          <span className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-card-alt text-ink-muted mb-4">
            <SearchX size={26} />
          </span>
          <h2 className="font-serif text-xl text-ink mb-1">Nessun risultato</h2>
          <p className="text-ink-muted">Prova a modificare la ricerca o il filtro dieta.</p>
        </div>
      ) : (
        <div className="space-y-10" data-testid="favorites-container">
          {grouped.map(([category, items]) => (
            <section key={category} data-testid={`favorites-group-${category.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-serif text-2xl text-ink">{category}</h2>
                <span className="text-xs font-medium text-sage bg-sage-light px-2.5 py-1 rounded-full">
                  {items.length}
                </span>
                <span className="flex-1 h-px bg-[#E2DACF]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((r) => (
                  <div
                    key={r.id}
                    data-testid="favorite-recipe-item"
                    onClick={() => setSelected(r)}
                    className="group cursor-pointer bg-white/90 border border-[#E2DACF] rounded-2xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(44,53,49,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(44,53,49,0.12)] transition-shadow duration-300 flex flex-col"
                  >
                    {r.image_url && (
                      <div className="aspect-[16/10] overflow-hidden bg-card-alt">
                        <img
                          src={mediaUrl(r.image_url)}
                          alt={r.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => (e.currentTarget.parentElement.style.display = "none")}
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-serif text-xl text-ink leading-snug group-hover:text-sage transition-colors duration-300">
                          {r.title}
                        </h3>
                        <button
                          data-testid="remove-favorite-button"
                          onClick={(e) => handleRemove(r.id, e)}
                          className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-ink-muted hover:bg-terracotta-light hover:text-terracotta transition-colors duration-300"
                          aria-label="Rimuovi dai preferiti"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {r.tagline && (
                        <p className="text-sm text-ink-muted italic font-serif mb-4 line-clamp-2">
                          {r.tagline}
                        </p>
                      )}
                      <div className="mt-auto flex items-center flex-wrap gap-2 text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-1 bg-card-alt px-2.5 py-1 rounded-full">
                          <Users size={12} /> {r.portions} port.
                        </span>
                        <span className="inline-flex items-center gap-1 bg-card-alt px-2.5 py-1 rounded-full">
                          {r.mise_en_place?.length || 0} ingredienti
                        </span>
                        {r.diet && (
                          <span className="inline-flex items-center gap-1 bg-sage-light text-sage px-2.5 py-1 rounded-full">
                            {r.diet}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto bg-cream border-[#E2DACF] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">{selected?.title}</DialogTitle>
            <DialogDescription className="sr-only">Dettaglio ricetta salvata</DialogDescription>
          </DialogHeader>
          {selected && (
            <RecipeCard
              recipe={selected}
              isSaved={true}
              hideActions={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
