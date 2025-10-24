import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Getinsert } from './getinsert';

describe('Getinsert', () => {
  let component: Getinsert;
  let fixture: ComponentFixture<Getinsert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Getinsert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Getinsert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
