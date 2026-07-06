import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult, User } from './user.model';

export interface CreateUserRequest {
  displayName: string;
  email: string;
  temporaryPassword: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`);
  }

  updateMe(username: string, bio?: string, profileImageUrl?: string): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/me`, { username, bio, profileImageUrl });
  }

  getUploadUrl(fileName: string): Observable<{ uploadUrl: string; blobUrl: string }> {
    return this.http.post<{ uploadUrl: string; blobUrl: string }>(`${environment.apiUrl}/images/upload-url`, { fileName });
  }

  uploadToBlob(uploadUrl: string, blob: Blob): Observable<void> {
    return this.http.put<void>(uploadUrl, blob, {
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': blob.type || 'image/jpeg' },
    });
  }

  getUsers(page = 1, pageSize = 20): Observable<PagedResult<User>> {
    return this.http.get<PagedResult<User>>(`${environment.apiUrl}/users`, {
      params: { page, pageSize }
    });
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users`, request);
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`);
  }
}
