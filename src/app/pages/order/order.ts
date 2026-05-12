import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/shared/services/api.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order.html',
  styleUrl: './order.scss'
})
export class Order {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  barang: any[] = [];
  orders: any[] = [];

  showDetailModal = false;
  selectedOrder: any = null;

  showAddModal = false;

  totalHarga = 0;
  totalItem = 0;

  orderForm: any = {
    id_user: null,
    id_proyek: null,
    pembayaran: '',
    items: []
  };

  ngOnInit() {
    this.loadBarang();
    this.loadOrder();
  }

  loadBarang() {
    this.api.getBarang().subscribe((res) => {
      this.barang = res?.val ?? res;
      this.cdr.detectChanges();
    });
  }

  loadOrder() {
    this.api.getOrder().subscribe((res) => {
      this.orders = res?.val ?? res;
      console.log(this.orders);
    });
  }

  openAdd() {
    this.orderForm = {
      id_user: null,
      id_proyek: null,
      pembayaran: '',
      items: []
    };

    this.totalHarga = 0;
    this.totalItem = 0;

    this.addItem();
    this.showAddModal = true;
  }

  closeAdd() {
    this.showAddModal = false;
  }

  addItem() {
    this.orderForm.items.push({
      id_barang: null,
      jumlah: 0,
      harga: 0,
      satuan: ''
    });
  }

  onBarangChange(item: any) {
    const b = this.barang.find((x) => x.id_barang == item.id_barang);

    if (b) {
      item.harga = b.harga; // auto harga
      item.satuan = b.satuan; // tampil satuan
    }

    this.hitungTotal();
  }

  hitungTotal() {
    this.totalHarga = 0;
    this.totalItem = 0;

    for (let i of this.orderForm.items) {
      this.totalHarga += (i.jumlah || 0) * (i.harga || 0);
      this.totalItem += i.jumlah || 0;
    }
  }

  submitOrder() {
    const payload = {
      invoice: {
        id_user: this.orderForm.id_user,
        id_proyek: this.orderForm.id_proyek,
        total_harga: this.totalHarga,
        status: 'menunggu',
        pembayaran: this.orderForm.pembayaran
      },
      items: this.orderForm.items
    };

    this.api.addOrder(payload).subscribe({
      next: () => {
        alert('Berhasil');
        this.closeAdd();
        this.loadOrder();
      }
    });
  }

  openDetail(o: any) {
    this.selectedOrder = o;
    this.showDetailModal = true;
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }
}
