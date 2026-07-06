import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Roles } from './roles';



export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  profileImageUrl?: string;
  bio?: string;
  role: string;
}



@Injectable({ providedIn: 'root' })
export class AuthService {
  private msal = inject(MsalService);
  private http = inject(HttpClient);

  currentUser = signal<CurrentUser | null>(null);
  isAdmin = computed(() => this.currentUser()?.role === Roles.Admin || this.currentUser()?.role === Roles.Owner);

  isLoggedIn(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  login(): void {
    this.msal.loginRedirect({ scopes: [environment.msal.apiScope] });
  }

  logout(): void {
    this.currentUser.set(null);
    this.msal.logoutRedirect();
  }

  // Fetches the current user from the API (role is resolved server-side from the AAD claim, not present in the token)
  loadCurrentUser(): Observable<CurrentUser | null> {
    if (!this.isLoggedIn()) {
      this.currentUser.set(null);
      return of(null);
    }

    return this.http.get<CurrentUser>(`${environment.apiUrl}/users/me`).pipe(
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }
}
