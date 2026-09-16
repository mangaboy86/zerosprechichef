export function buildShoppingText(r) {
  const norm = (v) =>
    (v || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lines = [];
  lines.push(`🛒 Lista della spesa — ${r.title}`);
  lines.push("");
  (r.shopping_list || []).forEach((s) => {
    const sub = (r.substitutions || []).find((x) => {
      const nx = norm(x.ingredient);
      const ns = norm(s);
      return nx === ns || nx.includes(ns) || ns.includes(nx);
    });
    lines.push(`• ${s}${sub?.substitute ? ` (in alternativa: ${sub.substitute})` : ""}`);
  });
  lines.push("");
  lines.push("Creato con Zero Sprechi Chef 🌱");
  return lines.join("\n");
}

export function buildRecipeText(r) {
  const lines = [];
  lines.push(`🍽 ${r.title}`);
  if (r.tagline) lines.push(r.tagline);
  lines.push(`Porzioni: ${r.portions}`);
  lines.push("");
  lines.push("PERCHÉ FUNZIONA");
  lines.push(r.why_it_works);
  lines.push("");
  lines.push("MISE EN PLACE & DOSAGGIO");
  (r.mise_en_place || []).forEach((m) => lines.push(`• ${m.ingredient} — ${m.quantity}`));
  lines.push("");
  lines.push("PREPARAZIONE DA BRIGATA");
  (r.brigade_steps || []).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");
  lines.push(`IL TOCCO DA CHEF: ${r.chef_touch}`);
  if (r.brigade_secret) lines.push(`IL SEGRETO DELLA BRIGATA: ${r.brigade_secret}`);
  if (r.wine_pairing) lines.push(`L'ABBINAMENTO DELLO CHEF: ${r.wine_pairing}`);
  if (r.scrap_tip) lines.push(`RECUPERO BUCCE & SCARTI: ${r.scrap_tip}`);
  if (r.impact && (r.impact.food_saved_g || r.impact.savings_eur)) {
    lines.push("");
    lines.push(`IMPATTO ZERO SPRECHI: ~${r.impact.food_saved_g} g di cibo salvato · ~${Number(r.impact.savings_eur).toFixed(2)} € risparmiati`);
  }
  if (r.shopping_list?.length) {
    lines.push("");
    lines.push("LISTA DELLA SPESA");
    r.shopping_list.forEach((s) => lines.push(`• ${s}`));
  }
  lines.push("");
  lines.push(r.allergen_disclaimer);
  lines.push("");
  lines.push("— Creato con Zero Sprechi Chef");
  return lines.join("\n");
}

export function printRecipe(r) {
  const esc = (s) => String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const mise = (r.mise_en_place || [])
    .map((m) => `<li><span>${esc(m.ingredient)}</span><em>${esc(m.quantity)}</em></li>`)
    .join("");
  const steps = (r.brigade_steps || []).map((s) => `<li>${esc(s)}</li>`).join("");
  const excluded = (r.excluded_ingredients || [])
    .map((x) => `<p><strong>${esc(x.ingredient)}</strong> — ${esc(x.reason)}</p>`)
    .join("");
  const shopping = (r.shopping_list || []).map((s) => `<li>${esc(s)}</li>`).join("");

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
  <title>${esc(r.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #2C3531; background: #F7F4EF; margin: 0; padding: 40px; }
    .wrap { max-width: 720px; margin: 0 auto; }
    h1 { font-family: 'Playfair Display', serif; font-size: 32px; margin: 0 0 6px; }
    .tag { font-style: italic; color: #5F6B66; margin: 0 0 4px; }
    .meta { color: #5B7065; font-weight: 600; font-size: 13px; margin-bottom: 24px; }
    h2 { font-family: 'Playfair Display', serif; font-size: 20px; color: #5B7065; border-bottom: 2px solid #E2DACF; padding-bottom: 6px; margin: 28px 0 12px; }
    ul { padding-left: 18px; } ol { padding-left: 20px; }
    li { margin: 6px 0; }
    .mise li { list-style: none; display: flex; justify-content: space-between; border-bottom: 1px dashed #E2DACF; padding: 4px 0; }
    .mise em { color: #5B7065; font-style: normal; }
    .tip { background: #F9ECE7; border-radius: 12px; padding: 14px 16px; margin-top: 12px; }
    .disc { font-size: 12px; color: #5F6B66; margin-top: 28px; border-top: 1px solid #E2DACF; padding-top: 12px; }
    .brand { text-align: center; color: #5B7065; font-weight: 600; margin-top: 20px; font-size: 13px; }
  </style></head><body><div class="wrap">
    <h1>${esc(r.title)}</h1>
    ${r.tagline ? `<p class="tag">${esc(r.tagline)}</p>` : ""}
    <p class="meta">Per ${esc(r.portions)} porzioni · ${esc(r.diet || "Onnivoro")}</p>
    <h2>Perché funziona</h2><p>${esc(r.why_it_works)}</p>
    <h2>Mise en Place & Dosaggio</h2><ul class="mise">${mise}</ul>
    <h2>Preparazione da Brigata</h2><ol>${steps}</ol>
    <h2>Il Tocco da Chef</h2><div class="tip">${esc(r.chef_touch)}</div>
    ${r.brigade_secret ? `<h2>Il Segreto della Brigata</h2><div class="tip">${esc(r.brigade_secret)}</div>` : ""}
    ${r.wine_pairing ? `<h2>L'Abbinamento dello Chef</h2><p>${esc(r.wine_pairing)}</p>` : ""}
    ${r.impact && (r.impact.food_saved_g || r.impact.savings_eur) ? `<h2>Impatto Zero Sprechi</h2><p>~${esc(r.impact.food_saved_g)} g di cibo salvato · ~${esc(Number(r.impact.savings_eur).toFixed(2))} € risparmiati</p>` : ""}
    ${r.scrap_tip ? `<h2>Recupero Bucce & Scarti</h2><div class="tip">${esc(r.scrap_tip)}</div>` : ""}
    ${shopping ? `<h2>Lista della Spesa</h2><ul>${shopping}</ul>` : ""}
    ${excluded ? `<h2>I rimasti in dispensa</h2>${excluded}` : ""}
    <p class="disc">${esc(r.allergen_disclaimer)}</p>
    <p class="brand">Creato con Zero Sprechi Chef</p>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
