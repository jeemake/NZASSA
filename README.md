# N’ZASSA Properties — site vitrine

Site one-page animé de N’ZASSA Properties (gestion locative, gestion immobilière, syndic de copropriété, conciergerie — Abidjan).

- HTML, CSS et JavaScript natifs, sans dépendance ni étape de build.
- Polices : Plus Jakarta Sans, Inter, JetBrains Mono (Google Fonts).
- Animations désactivées automatiquement si l’utilisateur a choisi « réduire les animations ».

## Lancer en local

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
python -m http.server 8000
```

## Formulaire de contact → Cloudflare R2

Le formulaire envoie chaque demande à un petit Worker Cloudflare (dossier `worker/`), qui la vérifie puis l’enregistre en JSON dans le bucket R2 **`nzassa-contact`** : `demandes/AAAA/MM/JJ/<horodatage>-<id>.json`.

1. Déployer le Worker (une seule fois, puis à chaque modification) :

   ```bash
   cd worker
   npx wrangler login
   npx wrangler deploy
   ```

2. Copier l’URL affichée (`https://nzassa-contact.<sous-domaine>.workers.dev`) dans l’attribut `data-endpoint` du formulaire de `index.html`, suivie de `/contact`.
3. Si le site est servi depuis un autre domaine que `jeemake.github.io`, l’ajouter à `ALLOWED_ORIGINS` dans `worker/wrangler.toml` et redéployer.

Tant que `data-endpoint` est vide, le formulaire reste une démonstration et n’envoie rien. Pour tester en local : `npx wrangler dev` dans `worker/` (R2 simulé), le site servi sur `http://localhost:8000` et `data-endpoint="http://127.0.0.1:8787/contact"`.

Les demandes se consultent dans le tableau de bord Cloudflare, rubrique R2 → `nzassa-contact`.

## À faire avant la mise en ligne

- Déployer le Worker et renseigner `data-endpoint` (voir ci-dessus).
- Remplacer les coordonnées d’exemple (`contact@nzassa.ci`, `+225 07 00 00 00 00`).
