import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Createemployee } from './createemployee';

describe('Createemployee', () => {
  let component: Createemployee;
  let fixture: ComponentFixture<Createemployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Createemployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Createemployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
