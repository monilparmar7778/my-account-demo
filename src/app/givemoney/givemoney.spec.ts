import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Givemoney } from './givemoney';

describe('Givemoney', () => {
  let component: Givemoney;
  let fixture: ComponentFixture<Givemoney>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Givemoney]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Givemoney);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
