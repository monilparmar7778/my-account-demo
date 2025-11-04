import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Getemployee } from './getemployee';

describe('Getemployee', () => {
  let component: Getemployee;
  let fixture: ComponentFixture<Getemployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Getemployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Getemployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
