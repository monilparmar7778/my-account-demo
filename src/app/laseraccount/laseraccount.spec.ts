import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Laseraccount } from './laseraccount';

describe('Laseraccount', () => {
  let component: Laseraccount;
  let fixture: ComponentFixture<Laseraccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Laseraccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Laseraccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
