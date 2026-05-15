import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Laporan } from './laporan';

describe('Laporan', () => {
  let component: Laporan;
  let fixture: ComponentFixture<Laporan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Laporan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Laporan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
