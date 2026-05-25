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

  login(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/user/login`, payload);
  }

  searchUser(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/user/search`, payload);
  }

  getUserLapangan() {
    return this.http.post<any>(`${environment.apiUrl}/user/get_lapangan`, {});
  }

  getBarang() {
    return this.http.post<any>(`${environment.apiUrl}/barang`, {});
  }

  getTotalBarang() {
    return this.http.get<any>(`${environment.apiUrl}/barang/total`);
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

  searchBarang(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/barang/search`, payload);
  }

  getProject() {
    return this.http.post<any>(`${environment.apiUrl}/project`, {});
  }

  addProject(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/project/add`, payload);
  }

  updateProject(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/project/update`, payload);
  }

  deleteProject(id_project: number) {
    return this.http.post<any>(`${environment.apiUrl}/project/delete`, { id_project });
  }

  searchProject(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/project/search`, payload);
  }

  getInvoice() {
    return this.http.post<any>(`${environment.apiUrl}/invoice`, {});
  }

  getInvoiceRole(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/invoice/role`, payload);
  }

  getInvoiceRecent() {
    return this.http.post<any>(`${environment.apiUrl}/invoice/recent`, {});
  }

  getMonthly() {
    return this.http.get<any>(`${environment.apiUrl}/invoice/monthly`);
  }

  getWait() {
    return this.http.get<any>(`${environment.apiUrl}/invoice/wait`);
  }

  addInvoice(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/invoice/add`, payload);
  }

  updateInvoice(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/invoice/update`, payload);
  }

  updateStatusInvoice(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/invoice/status`, payload);
  }

  deleteInvoice(id_invoice: number) {
    return this.http.post<any>(`${environment.apiUrl}/invoice/delete`, { id_invoice });
  }

  getStock() {
    return this.http.post<any>(`${environment.apiUrl}/stock`, {});
  }

  addStock(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/stock/add`, payload);
  }

  updateStock(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/stock/update`, payload);
  }

  deleteStock(id_stock: number) {
    return this.http.post<any>(`${environment.apiUrl}/stock/delete`, { id_stock });
  }

  getOrder() {
    return this.http.post<any>(`${environment.apiUrl}/order`, {});
  }

  addOrder(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/order/add`, payload);
  }

  updateOrder(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/order/update`, payload);
  }

  deleteOrder(id_order: number) {
    return this.http.post<any>(`${environment.apiUrl}/order/delete`, { id_order });
  }

  approveOrder(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/order/approve`, payload);
  }

  getBrgMasuk() {
    return this.http.post<any>(`${environment.apiUrl}/brgMasuk`, {});
  }

  getMonthlyBrgMasuk() {
    return this.http.get<any>(`${environment.apiUrl}/brgMasuk/monthly`);
  }

  addBrgMasuk(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/brgMasuk/add`, payload);
  }

  updateBrgMasuk(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/brgMasuk/update`, payload);
  }

  deleteBrgMasuk(id_brg_masuk: number) {
    return this.http.post<any>(`${environment.apiUrl}/brgMasuk/delete`, { id_brg_masuk });
  }

  getBrgKeluar() {
    return this.http.post<any>(`${environment.apiUrl}/brgKeluar`, {});
  }

  getMonthlyBrgKeluar() {
    return this.http.get<any>(`${environment.apiUrl}/brgKeluar/monthly`);
  }

  getBrgKeluarId(id_invoice: number) {
    return this.http.post<any>(`${environment.apiUrl}/brgKeluar/invoice`, { id_invoice });
  }

  laporanPenjualan() {
    return this.http.get<any>(`${environment.apiUrl}/brgKeluar/laporan_penjualan`);
  }

  getRetur() {
    return this.http.post<any>(`${environment.apiUrl}/retur/`, {});
  }
  addRetur(data: any) {
    return this.http.post(`${environment.apiUrl}/retur/add`, data);
  }

  getActivity() {
    return this.http.get<any>(`${environment.apiUrl}/mix/activity`);
  }
}
