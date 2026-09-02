import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Le jeton dure vingt-quatre heures ; passé ce délai le serveur répond 401. */
const RETURN_URL_PARAM = 'retour';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isExpiredSession(error, token, req.url)) {
        // La session est morte : la garder en mémoire ferait échouer en silence toutes les
        // requêtes suivantes, sur une page qui continue de s'afficher comme si de rien
        // n'était. On la ferme et on renvoie vers la connexion, en gardant l'adresse
        // demandée pour y revenir une fois reconnecté.
        auth.logout();
        router.navigate(['/login'], {
          queryParams: { [RETURN_URL_PARAM]: router.url }
        });
      }

      return throwError(() => error);
    })
  );
};

/**
 * Distingue une session expirée d'un refus ordinaire.
 *
 * Sans jeton envoyé, un 401 n'apprend rien sur la session — c'est le serveur qui refuse une
 * requête anonyme. Et les routes d'authentification répondent elles-mêmes 401 sur un mauvais
 * mot de passe : les traiter comme une expiration déconnecterait quelqu'un qui vient
 * seulement de se tromper en saisissant ses identifiants.
 */
function isExpiredSession(error: HttpErrorResponse, token: string | null, url: string): boolean {
  return error.status === 401 && token !== null && !url.includes('/api/auth/');
}
