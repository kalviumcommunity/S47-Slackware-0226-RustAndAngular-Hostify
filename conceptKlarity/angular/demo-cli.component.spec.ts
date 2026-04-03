import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoCliComponent } from './demo-cli.component';

describe('DemoCliComponent', () => {
  let component: DemoCliComponent;
  let fixture: ComponentFixture<DemoCliComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DemoCliComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoCliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
