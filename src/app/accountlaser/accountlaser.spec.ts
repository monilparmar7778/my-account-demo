import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Accountlaser } from './accountlaser';

describe('Accountlaser', () => {
  let component: Accountlaser;
  let fixture: ComponentFixture<Accountlaser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accountlaser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Accountlaser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
