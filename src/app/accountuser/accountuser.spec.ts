import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Accountuser } from './accountuser';

describe('Accountuser', () => {
  let component: Accountuser;
  let fixture: ComponentFixture<Accountuser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accountuser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Accountuser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
