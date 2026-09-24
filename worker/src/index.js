// Formulaire de contact N'ZASSA : valide la demande puis l'enregistre en JSON dans R2.
// Une demande = un objet, rangé par date : demandes/AAAA/MM/JJ/<horodatage>-<id>.json

const BESOINS = new Set(["Gestion locative", "Gestion immobilière", "Syndic", "Conciergerie"]);
const TAILLE_MAX = 16 * 1024;
const LIMITES = { nom: 120, tel: 40, mail: 200, msg: 4000 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origine = request.headers.get("Origin") || "";
    const autorisees = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const cors = { Vary: "Origin" };
    if (autorisees.includes(origine)) cors["Access-Control-Allow-Origin"] = origine;

    if (url.pathname !== "/contact") return json({ error: "Introuvable." }, 404, cors);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" } });
    }
    if (request.method !== "POST") return json({ error: "Méthode non autorisée." }, 405, { ...cors, Allow: "POST, OPTIONS" });
    if (!autorisees.includes(origine)) return json({ error: "Origine non autorisée." }, 403, cors);

    if (Number(request.headers.get("Content-Length") || 0) > TAILLE_MAX) return json({ error: "Demande trop volumineuse." }, 413, cors);
    let d;
    try {
      const texte = await request.text();
      if (texte.length > TAILLE_MAX) return json({ error: "Demande trop volumineuse." }, 413, cors);
      d = JSON.parse(texte);
    } catch {
      return json({ error: "Format de demande invalide." }, 400, cors);
    }
    if (!d || typeof d !== "object" || Array.isArray(d)) return json({ error: "Format de demande invalide." }, 400, cors);

    // Champ piège invisible : un humain le laisse vide, un robot le remplit.
    if (typeof d.site === "string" && d.site.trim()) return json({ ok: true }, 200, cors);

    const champ = k => (typeof d[k] === "string" ? d[k].trim() : "");
    const nom = champ("nom"), tel = champ("tel"), mail = champ("mail"), msg = champ("msg");
    const besoins = Array.isArray(d.besoins) ? [...new Set(d.besoins.filter(b => BESOINS.has(b)))] : [];

    if (!nom) return json({ error: "Indiquez votre nom." }, 422, cors);
    if (!mail && !tel) return json({ error: "Laissez un courriel ou un numéro de téléphone." }, 422, cors);
    if (mail && !/^\S+@\S+\.\S+$/.test(mail)) return json({ error: "Le courriel semble incomplet." }, 422, cors);
    for (const [k, v] of Object.entries({ nom, tel, mail, msg })) {
      if (v.length > LIMITES[k]) return json({ error: `Le champ « ${k} » est trop long.` }, 422, cors);
    }

    const recu = new Date().toISOString();
    const id = crypto.randomUUID();
    const cle = `demandes/${recu.slice(0, 10).replaceAll("-", "/")}/${recu.replace(/[:.]/g, "-")}-${id}.json`;
    const demande = { id, recu, nom, tel, mail, besoins, msg, origine, pays: request.cf?.country || null };

    await env.DEMANDES.put(cle, JSON.stringify(demande, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    return json({ ok: true, id }, 201, cors);
  },
};

function json(corps, status, entetes = {}) {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...entetes } });
}
