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

### Déploiement automatique (GitHub Actions)

Le workflow `.github/workflows/deploy-worker.yml` déploie le Worker à chaque modification du dossier `worker/`, puis inscrit lui-même son adresse dans `data-endpoint`. Une seule mise en place :

1. Cloudflare → **Account API tokens** → **Create Token** → modèle **Edit Cloudflare Workers**, limité à votre compte.
2. GitHub → dépôt → **Settings → Secrets and variables → Actions** : ajouter `CLOUDFLARE_API_TOKEN` (le jeton) et `CLOUDFLARE_ACCOUNT_ID` (visible dans le tableau de bord Cloudflare, page d’accueil du compte).
3. Onglet **Actions** → « Déployer le Worker de contact » → relancer le dernier passage (**Re-run jobs**).

Si le compte n’a encore jamais utilisé Workers, ouvrir une fois **Workers & Pages** dans le tableau de bord pour choisir le sous-domaine `workers.dev`.

### Déploiement manuel

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Puis copier l’URL affichée, suivie de `/contact`, dans l’attribut `data-endpoint` du formulaire de `index.html`. Si le site est servi depuis un autre domaine que `jeemake.github.io`, l’ajouter à `ALLOWED_ORIGINS` dans `worker/wrangler.toml`.

Tant que `data-endpoint` est vide, le formulaire reste une démonstration et n’envoie rien. Pour tester en local : `npx wrangler dev` dans `worker/` (R2 simulé), le site servi sur `http://localhost:8000` et `data-endpoint="http://127.0.0.1:8787/contact"`.

Les demandes se consultent dans le tableau de bord Cloudflare, rubrique R2 → `nzassa-contact`.

## À faire avant la mise en ligne

- Ajouter les deux secrets Cloudflare pour que le formulaire enregistre les demandes dans R2 (voir ci-dessus).
- Remplacer les coordonnées d’exemple (`contact@nzassa.ci`, `+225 07 00 00 00 00`).
