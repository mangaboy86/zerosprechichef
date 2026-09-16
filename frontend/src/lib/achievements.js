export const ACHIEVEMENTS = [
  { id: "first-recipe", title: "Prima Ricetta", desc: "Hai creato la tua prima ricetta anti-spreco", metric: "count", threshold: 1, icon: "sparkles" },
  { id: "food-500", title: "Primo Recupero", desc: "500 g di cibo salvato dalla spazzatura", metric: "food", threshold: 500, icon: "sprout" },
  { id: "save-5", title: "Primo Risparmio", desc: "5 € risparmiati con la cucina di recupero", metric: "savings", threshold: 5, icon: "piggy" },
  { id: "food-2000", title: "Salva-Frigo", desc: "2 kg di cibo salvato in totale", metric: "food", threshold: 2000, icon: "sprout" },
  { id: "co2-2", title: "Amico del Clima", desc: "2 kg di CO₂ evitata", metric: "co2", threshold: 2, icon: "leaf" },
  { id: "water-500", title: "Guardiano dell'Acqua", desc: "500 L di acqua risparmiata", metric: "water", threshold: 500, icon: "droplets" },
  { id: "save-25", title: "Portafoglio Felice", desc: "25 € risparmiati in totale", metric: "savings", threshold: 25, icon: "piggy" },
  { id: "count-10", title: "Cuoco Affezionato", desc: "10 ricette salvate nei preferiti", metric: "count", threshold: 10, icon: "chef" },
  { id: "food-5000", title: "Eroe Anti-Spreco", desc: "5 kg di cibo salvato: che impresa!", metric: "food", threshold: 5000, icon: "trophy" },
  { id: "co2-10", title: "Custode del Pianeta", desc: "10 kg di CO₂ evitata", metric: "co2", threshold: 10, icon: "leaf" },
];

export function computeAchievements(totals, count) {
  const values = { ...totals, count };
  return ACHIEVEMENTS.map((a) => {
    const value = Number(values[a.metric] || 0);
    return {
      ...a,
      unlocked: value >= a.threshold,
      progress: Math.min(1, value / a.threshold),
    };
  });
}
