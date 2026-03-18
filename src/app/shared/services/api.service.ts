import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.post<any>(`${environment.apiUrl}/user/`, {});
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

  getBarang() {
    return this.http.post<any>(`${environment.apiUrl}/barang/`, {});
  }

  addBarang(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/barang/add`, payload);
  }

  updateBarang(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/barang/update`, payload);
  }

  deleteBarang(id_barang: number) {
    return this.http.post<any>(`${environment.apiUrl}/barang/delete`, { id_barang });
  }

  getProject() {
    return this.http.post<any>(`${environment.apiUrl}/project/`, {});
  }

  addProject(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/project/add`, payload);
  }

  updateProject(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/project/update`, payload);
  }

  deleteProject(id_barang: number) {
    return this.http.post<any>(`${environment.apiUrl}/project/delete`, { id_barang });
  }
}
