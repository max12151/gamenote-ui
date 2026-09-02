/*
 * Environnement des builds de production, substitué à `environments.ts` par le
 * `fileReplacements` d'angular.json. Sans ce branchement, il n'était jamais lu : un build
 * de production partait en appelant http://localhost:8080, l'adresse du poste de dev.
 */
export const environment = {
  production: true,

  /*
   * Vide, donc les appels partent en chemins relatifs (`/api/...`) : le cas normal, où le
   * front est servi par le même hôte que l'API, derrière un serveur qui redirige. Si l'API
   * vit ailleurs, mettre ici son adresse complète — et penser à ajouter l'origine du front
   * à CORS_ALLOWED_ORIGINS côté serveur.
   */
  apiUrl: '',
};
