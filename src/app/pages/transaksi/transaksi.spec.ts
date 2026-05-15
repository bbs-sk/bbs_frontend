import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Transaksi } from './transaksi';

describe('Transaksi', () => {
  let component: Transaksi;
  let fixture: ComponentFixture<Transaksi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transaksi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Transaksi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
