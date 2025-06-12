// ats-download-pdf.component.ts
import { Component, Input } from '@angular/core';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-download-pdf',
  standalone: true,
  templateUrl: './download-pdf.component.html',
  styleUrls: ['./download-pdf.component.css'],
})
export class DownloadPdfComponent {
  @Input() containerId: string = 'pdf-content'; // ID del contenedor a capturar

  downloadPDF(): void {
    const element = document.getElementById(this.containerId);
    if (element) {
      // Estilo temporal para el contenedor
      const originalStyles = {
        boxShadow: element.style.boxShadow,
        position: element.style.position,
      };
      element.style.boxShadow = 'none';
      element.style.position = 'static'; // Evita superposiciones

      html2canvas(element, {
        scale: 1,
        backgroundColor: '#FFFFFF', // Fondo blanco (no transparente)
        logging: false,
        useCORS: true,
        width: 780,
        height: 1700,
        x: 0,
        y: 0,
        ignoreElements: (el) => {
          // Ignorar elementos ocultos o superpuestos
          return el.classList.contains('hidden-element');
        },
      }).then((canvas) => {
        // Restaurar estilos originales
        element.style.boxShadow = originalStyles.boxShadow;
        element.style.position = originalStyles.position;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('cv.pdf');
      });
    }
  }
}
