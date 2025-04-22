// ats-download-pdf.component.ts
import { Component, Input } from '@angular/core';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-ats-download-pdf',
  standalone: true,
  templateUrl: './ats-download-pdf.component.html',
  styleUrls: ['./ats-download-pdf.component.css'],
})
export class AtsDownloadPdfComponent {
  @Input() containerId: string = 'pdf-content'; // ID del contenedor a capturar

  downloadPDF(): void {
    const element = document.getElementById(this.containerId);
    if (element) {
      html2canvas(element).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('cv.pdf');
      });
    }
  }
}