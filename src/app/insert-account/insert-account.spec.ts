import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsertAccount } from './insert-account';

describe('InsertAccount', () => {
  let component: InsertAccount;
  let fixture: ComponentFixture<InsertAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsertAccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsertAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
