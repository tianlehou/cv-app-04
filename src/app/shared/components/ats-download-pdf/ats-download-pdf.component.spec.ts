import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtsDownloadPdfComponent } from './ats-download-pdf.component';

describe('AtsDownloadPdfComponent', () => {
  let component: AtsDownloadPdfComponent;
  let fixture: ComponentFixture<AtsDownloadPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsDownloadPdfComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtsDownloadPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
