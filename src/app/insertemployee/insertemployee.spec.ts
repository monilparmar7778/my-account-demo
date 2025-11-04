import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Insertemployee } from './insertemployee';

describe('Insertemployee', () => {
  let component: Insertemployee;
  let fixture: ComponentFixture<Insertemployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Insertemployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Insertemployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
