import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/models/user.model';
import { UpdateProfileRequest } from '../models/update-profile-request.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly endpoint = `${environment.apiUrl}/api/users/me`;

  getCurrentProfile(): Observable<User> {
    return this.http.get<User>(this.endpoint).pipe(
      tap(user => this.auth.updateStoredUser(user))
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(this.endpoint, request).pipe(
      tap(user => this.auth.updateStoredUser(user))
    );
  }
}
