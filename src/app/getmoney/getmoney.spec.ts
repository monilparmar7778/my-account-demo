import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Getmoney } from './getmoney';

describe('Getmoney', () => {
  let component: Getmoney;
  let fixture: ComponentFixture<Getmoney>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Getmoney]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Getmoney);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
