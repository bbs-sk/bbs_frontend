import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Barang } from './barang';

describe('Barang', () => {
  let component: Barang;
  let fixture: ComponentFixture<Barang>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Barang]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Barang);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
