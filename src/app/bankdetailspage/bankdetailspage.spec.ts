import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bankdetailspage } from './bankdetailspage';

describe('Bankdetailspage', () => {
  let component: Bankdetailspage;
  let fixture: ComponentFixture<Bankdetailspage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bankdetailspage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bankdetailspage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
