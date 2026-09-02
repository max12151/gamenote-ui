# GameNote — interface

Front Angular du site de notation de jeux. L'API vit dans un dépôt séparé (`GameNote`) et
doit tourner pour que l'application serve à quelque chose.

## Prérequis

| | Version |
|---|---|
| Node | 22+ (testé en 24) |
| Angular | 21 |
| API GameNote | démarrée sur `http://localhost:8080` |

**Navigateur** : l'interface s'appuie sur des fonctionnalités récentes — `<dialog>` natif,
API Popover, ancrage CSS (`anchor-name`), et `appearance: base-select` pour les listes
déroulantes. Chrome ou Edge 135+ pour tout voir. Ailleurs, chaque cas dégrade
proprement (menu système à la place du panneau stylé, bulle posée dans un coin plutôt
qu'ancrée), mais l'apparence n'est pas identique.

## Lancer

```bash
npm install
npm start
```

L'application est servie sur `http://localhost:4200` et recharge à chaque modification.

> **Après avoir touché à `angular.json`, redémarrez `ng serve`.** Le serveur ne relit pas ce
> fichier à chaud. Comme il porte `stylePreprocessorOptions.includePaths`, un serveur lancé
> avant ne sait plus résoudre `@use 'shared'` : les pages concernées s'affichent alors
> **sans aucun style**, sans erreur visible.

## Structure

```
src/app/
  core/          authentification (service, garde, intercepteur), modèles partagés
  features/      une page = un dossier : data-access / models / pages
  shared/        composants réutilisés (pastille d'identité, sélecteur de note…)
  styles/        _shared.scss : les mixins du site
  styles.scss    jetons de design (couleurs, rayons, ombres) + règles de base
```

### Les styles

Aucune couleur, aucun rayon ni aucune ombre n'est écrit en dur dans une feuille de
composant : tout passe par les jetons de `styles.scss`. Les motifs récurrents — coquille de
page, en-tête, boutons, cartes, modales, jauges, listes déroulantes — sont des **mixins**
dans `src/styles/_shared.scss`, importés par `@use 'shared' as *`.

Ce sont des mixins et non des classes globales : chaque composant garde ses propres
sélecteurs, rien ne fuit d'une page à l'autre. En contrepartie le CSS s'inline dans chaque
composant, ce qui explique des feuilles compilées de 6 à 10 ko et des budgets desserrés en
conséquence dans `angular.json`.

Trois teintes portent chacune un sens :

- **violet** — la marque et ce sur quoi on agit (boutons, liens, page courante)
- **sarcelle** — ce que disent les autres joueurs (avis, commentaires, communauté)
- **ambre** — ce qui n'est pas encore là (sorties à venir, compteurs d'attente)

## Build de production

```bash
npm run build
```

La configuration `production` remplace `src/environments/environments.ts` par
`environment.prod.ts`, dont l'`apiUrl` est **vide** : les appels partent en chemins relatifs
(`/api/...`), ce qui suppose que le front et l'API sont servis par le même hôte. Si l'API
est ailleurs, renseigner son adresse complète dans `environment.prod.ts` — et ajouter
l'origine du front à `CORS_ALLOWED_ORIGINS` côté serveur.

## Sessions

Le jeton JWT est conservé dans le `localStorage` et ajouté par
`core/auth/auth.interceptor.ts`. Quand le serveur répond 401 alors qu'un jeton a été
envoyé, l'intercepteur considère la session expirée : il la ferme et renvoie vers
`/login?retour=…`, la page demandée étant rejouée après reconnexion. Les erreurs 401 des
routes d'authentification sont ignorées — un mot de passe erroné n'est pas une expiration.

## Limites connues

- **Un seul test**, celui généré par le CLI.
- Pas de remise à zéro globale de `box-sizing` : une `width` porte par défaut sur le seul
  contenu, et les marges intérieures s'y ajoutent. Plusieurs composants le compensent à la
  main.
- L'application dépend d'IGDB pour la recherche, la page Découvrir et les sorties à venir.
  Si le réseau bloque `api.igdb.com`, ces trois blocs affichent un message d'indisponibilité
  et le reste du site continue de fonctionner.
