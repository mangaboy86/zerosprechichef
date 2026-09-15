import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getFavorites, removeFavorite } from "@/lib/storage";
import { RecipeCard } from "@/components/RecipeCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Heart, Trash2, BookOpen, Users, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setFavs(getFavorites());
  }, []);

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
      ) : (
        <div
          data-testid="favorites-container"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {favs.map((r) => (
            <div
              key={r.id}
              data-testid="favorite-recipe-item"
              onClick={() => setSelected(r)}
              className="group cursor-pointer bg-white/90 border border-[#E2DACF] rounded-2xl p-6 shadow-[0_4px_20px_-2px_rgba(44,53,49,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(44,53,49,0.12)] transition-shadow duration-300 flex flex-col"
            >
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
              <div className="mt-auto flex items-center gap-2 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1 bg-card-alt px-2.5 py-1 rounded-full">
                  <Users size={12} /> {r.portions} port.
                </span>
                <span className="inline-flex items-center gap-1 bg-card-alt px-2.5 py-1 rounded-full">
                  {r.mise_en_place?.length || 0} ingredienti
                </span>
              </div>
            </div>
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
