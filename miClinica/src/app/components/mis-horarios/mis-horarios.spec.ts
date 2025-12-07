import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisHorarios } from './mis-horarios';

describe('MisHorarios', () => {
  let component: MisHorarios;
  let fixture: ComponentFixture<MisHorarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisHorarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisHorarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
