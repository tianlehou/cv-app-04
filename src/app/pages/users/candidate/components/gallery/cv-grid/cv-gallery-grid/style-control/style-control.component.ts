import { CommonModule } from '@angular/common';
import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../../../../../../../shared/services/firebase.service';
import { ComponentStyles } from '../../../../../../../../shared/models/component-styles.model';
import { ConfirmationModalService } from '../../../../../../../../shared/services/confirmation-modal.service';
import { ToastService } from '../../../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-style-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './style-control.component.html',
  styleUrls: ['./style-control.component.css'],
})
export class StyleControlComponent implements OnInit {
  @Input() componentName!: string;
  @Output() styleChange = new EventEmitter<ComponentStyles>();
  
  visible = false;
  hiding = false;
  isLoading = true;

  // Opciones de configuración
  fontFamilyOptions = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: '"Calibri", "Helvetica", sans-serif', label: 'Calibri' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Courier New, monospace', label: 'Courier New' },
  ];

  fontSizeOptions = [
    { value: '10px', label: 'Pequeño (10px)' },
    { value: '12px', label: 'Mediano (12px)' },
    { value: '14px', label: 'Grande (14px)' },
    { value: '16px', label: 'Extra grande (16px)' },
  ];

  paddingOptions = [
    { value: '2rem 1rem', label: 'Pequeño' },
    { value: '2rem 2rem', label: 'Mediano' },
    { value: '2rem 3rem', label: 'Grande' },
  ];

  barColorOptions = [
    { value: 'var(--clr-blue-dark)', label: 'Defecto' },
    { value: '#dc3545', label: 'Rojo' },
    { value: '#0d6efd', label: 'Azul' },
    { value: '#ffc107', label: 'Amarillo' },
    { value: '#6f42c1', label: 'Púrpura' },
    { value: '#198754', label: 'Verde' },
    { value: '#ff9800', label: 'Naranja' },
    { value: '#6c757d', label: 'Gris' },
  ];

  // Valores seleccionados con valores por defecto
  selectedFontSize = '12px';
  selectedPadding = '2rem 2rem';
  selectedBarColor = 'var(--clr-blue-dark)';
  selectedFontFamily = 'Arial, sans-serif';

  private firebaseService = inject(FirebaseService);
  private confirmationModal = inject(ConfirmationModalService);
  private toastService = inject(ToastService);

  async ngOnInit() {
    await this.loadSavedStyles();
    this.isLoading = false;
  }

  private async loadSavedStyles() {
    try {
      const currentUser = await this.firebaseService.getCurrentUser();
      if (currentUser?.email) {
        const savedStyles = await this.firebaseService.getComponentStyles(
          currentUser.email,
          this.componentName
        );

        if (savedStyles) {
          this.applySavedStyles(savedStyles);
          this.emitStyleChanges(); // Notificar a los componentes padres
        }
      }
    } catch (error) {
      console.error('Error loading styles:', error);
      this.toastService.show('Error al cargar los estilos guardados', 'error');
    }
  }

  private applySavedStyles(styles: ComponentStyles) {
    // Font Family
    const fontFamilyOption = this.fontFamilyOptions.find(opt => opt.value === styles.fontFamily);
    this.selectedFontFamily = fontFamilyOption ? fontFamilyOption.value : 'Arial, sans-serif';

    // Font Size
    const fontSizeOption = this.fontSizeOptions.find(opt => opt.value === styles.fontSize);
    this.selectedFontSize = fontSizeOption ? fontSizeOption.value : '12px';

    // Padding
    const paddingOption = this.paddingOptions.find(opt => opt.value === styles.padding);
    this.selectedPadding = paddingOption ? paddingOption.value : '2rem 2rem';

    // Bar Color
    const barColorOption = this.barColorOptions.find(opt => opt.value === styles.barColor);
    this.selectedBarColor = barColorOption ? barColorOption.value : 'var(--clr-blue-dark)';
  }

  // Resto de los métodos permanecen igual...
  toggleVisibility() {
    if (this.visible) {
      this.hiding = true;
      setTimeout(() => {
        this.visible = false;
        this.hiding = false;
      }, 1500);
    } else {
      this.visible = true;
    }
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

  async saveStyles() {
    const styles: ComponentStyles = {
      fontFamily: this.selectedFontFamily,
      fontSize: this.selectedFontSize,
      padding: this.selectedPadding,
      barColor: this.selectedBarColor
    };

    this.confirmationModal.show(
      {
        title: 'Guardar ajustes',
        message: '¿Estás seguro que deseas guardar estos ajustes?',
        confirmText: 'Guardar',
        cancelText: 'Cancelar'
      },
      async () => {
        try {
          const currentUser = await this.firebaseService.getCurrentUser();
          
          if (currentUser && currentUser.email) {
            await this.firebaseService.updateUserData(currentUser.email, {
              'cv-styles': {
                [this.componentName]: styles
              }
            });
            this.toastService.show('Ajustes guardados correctamente', 'success');
          }
        } catch (error) {
          console.error('Error al guardar los ajustes:', error);
          this.toastService.show('Error al guardar los ajustes', 'error');
        }
      }
    );
  }
}