import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from 'src/app/shared/services/api.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import localeId from '@angular/common/locales/id';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeId);

@Component({
  selector: 'app-laporan',
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatIconModule, MatButtonModule],
  templateUrl: './laporan.html',
  styleUrl: './laporan.scss'
})
export class Laporan {}
