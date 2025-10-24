import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainChild } from './main-child';

describe('MainChild', () => {
  let component: MainChild;
  let fixture: ComponentFixture<MainChild>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainChild]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainChild);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
