import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-style-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './style-control.component.html',
  styleUrls: ['./style-control.component.css'],
})
export class StyleControlComponent {
  @Output() styleChange = new EventEmitter<{
    fontSize: string;
    padding: string;
    barColor: string;
    fontFamily: string; 
  }>();
  visible = false;

  // Opciones de fuente compatibles con ATS
  fontFamilyOptions = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: '"Calibri", "Helvetica", sans-serif', label: 'Calibri' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Courier New, monospace', label: 'Courier New' },
  ];

  // Opciones de color para la barra
  barColorOptions = [
    { value: '#dc3545', label: 'Rojo', class: 'red' },
    { value: '#0d6efd', label: 'Azul', class: 'blue' },
    { value: '#ffc107', label: 'Amarillo', class: 'yellow' },
    { value: '#198754', label: 'Verde', class: 'green' },
    { value: '#6f42c1', label: 'Púrpura', class: 'purple' },
    { value: '#6c757d', label: 'Gris', class: 'gray' },
  ];

  fontSizeOptions = [
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
  ];

  paddingOptions = [
    { value: '2rem 1rem', label: '1' },
    { value: '2rem 2rem', label: '2' },
    { value: '2rem 3rem', label: '3' },
  ];

  selectedFontSize = '14px';
  selectedPadding = '2rem 2rem';
  selectedBarColor = 'var(--clr-blue-dark)';
  selectedFontFamily = 'Arial, sans-serif';

  toggleVisibility() {
    this.visible = !this.visible;
  }

  onFontSizeChange(size: string) {
    this.selectedFontSize = size;
    this.emitStyleChanges();
  }

  onPaddingChange(padding: string) {
    this.selectedPadding = padding;
    this.emitStyleChanges();
  }

  onBarColorChange(color: string) {
    this.selectedBarColor = color;
    this.emitStyleChanges();
  }

  onFontFamilyChange(fontFamily: string): void {
    this.selectedFontFamily = fontFamily;
    this.emitStyleChanges();
  }

  private emitStyleChanges() {
    this.styleChange.emit({
      fontSize: this.selectedFontSize,
      padding: this.selectedPadding,
      barColor: this.selectedBarColor,
      fontFamily: this.selectedFontFamily
    });
  }
}