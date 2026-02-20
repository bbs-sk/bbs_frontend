import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.post<any>(`${environment.apiUrl}/user`, {});
  }

  addUser(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/user/add`, payload);
  }

  updateUser(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/user/update`, payload);
  }

  deleteUser(id_user: number) {
    return this.http.post<any>(`${environment.apiUrl}/user/delete`, { id_user });
  }
}
