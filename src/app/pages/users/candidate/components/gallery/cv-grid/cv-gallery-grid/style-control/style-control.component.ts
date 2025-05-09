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
  showColorPicker = false;
  customBarColor = '#000000';
  userColorFavorites: string[] = [];
  isAddingColor = false;
  newFavoriteColor = '#000000';
  selectedColorIndex: number | null = null;

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
    { value: '10px', label: 'Extra chico (10px)' },
    { value: '11px', label: 'Chico (11px)' },
    { value: '12px', label: 'Mediano (12px)' },
    { value: '13px', label: 'Grande (13px)' },
    { value: '14px', label: 'Extra grande (14px)' },
  ];

  paddingOptions = [
    { value: '2rem 1rem', label: 'Pequeño' },
    { value: '2rem 2rem', label: 'Mediano' },
    { value: '2rem 3rem', label: 'Grande' },
  ];

  barColorOptions = [
    { value: '#dc3545', label: 'Rojo #dc3545' },
    { value: '#ff9800', label: 'Naranja #ff9800' },
    { value: '#ffc107', label: 'Amarillo #ffc107' },
    { value: '#198754', label: 'Verde #198754' },
    { value: '#0d6efd', label: 'Azul #0d6efd' },
    { value: '#6f42c1', label: 'Púrpura #6f42c1' },
    { value: '#6c757d', label: 'Gris #6c757d' },
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
    await this.loadColorFavorites();
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
          this.emitStyleChanges();
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
    const isCustomColor = styles.barColor && !this.barColorOptions.some(opt => opt.value === styles.barColor);
    if (isCustomColor) {
      this.selectedBarColor = styles.barColor;
      this.showColorPicker = true;
      this.customBarColor = styles.barColor;
    } else {
      const barColorOption = this.barColorOptions.find(opt => opt.value === styles.barColor);
      this.selectedBarColor = barColorOption ? barColorOption.value : 'var(--clr-blue-dark)';
      this.showColorPicker = false;
    }
  }

  async loadColorFavorites() {
    try {
      const currentUser = await this.firebaseService.getCurrentUser();
      if (currentUser?.email) {
        this.userColorFavorites = await this.firebaseService.getColorFavorites(currentUser.email);
      }
    } catch (error) {
      console.error('Error loading color favorites:', error);
      this.toastService.show('Error al cargar colores favoritos', 'error');
    }
  }

  async saveColorFavorites() {
    try {
      const currentUser = await this.firebaseService.getCurrentUser();
      if (currentUser?.email) {
        await this.firebaseService.saveColorFavorites(currentUser.email, this.userColorFavorites);
        this.toastService.show('Colores favoritos guardados', 'success');
      }
    } catch (error) {
      console.error('Error saving color favorites:', error);
      this.toastService.show('Error al guardar colores favoritos', 'error');
    }
  }

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
    if (color === 'custom') {
      this.showColorPicker = true;
      this.customBarColor = this.selectedBarColor.startsWith('#') ? this.selectedBarColor : '#000000';
      this.selectedBarColor = this.customBarColor;
      this.emitStyleChanges();
    } else {
      this.showColorPicker = false;
      this.selectedBarColor = color;
      this.emitStyleChanges();
    }
  }

  onCustomColorChange() {
    this.selectedBarColor = this.customBarColor;
    this.emitStyleChanges();
  }

  onFontFamilyChange(fontFamily: string): void {
    this.selectedFontFamily = fontFamily;
    this.emitStyleChanges();
  }

  addToFavorites(color: string) {
    if (!this.userColorFavorites.includes(color)) {
      this.userColorFavorites.push(color);
      this.saveColorFavorites();
      this.isAddingColor = false;
      this.newFavoriteColor = '#000000';
    }
  }

  selectFavoriteColor(color: string) {
    this.selectedBarColor = color;
    this.showColorPicker = false;
    this.emitStyleChanges();
  }

  removeFavorite(index: number) {
    this.userColorFavorites.splice(index, 1);
    this.saveColorFavorites();
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
            // Primero obtenemos los estilos actuales para no sobrescribir los colores favoritos
            const currentData = await this.firebaseService.getUserData(this.firebaseService.formatEmailKey(currentUser.email));
            
            // Creamos el objeto de actualización manteniendo los datos existentes
            const updateData = {
              'cv-styles': {
                ...(currentData?.['cv-styles'] || {}), // Mantenemos todos los estilos existentes
                [this.componentName]: styles // Actualizamos solo los estilos del componente actual
              }
            };
  
            await this.firebaseService.updateUserData(currentUser.email, updateData);
            this.toastService.show('Ajustes guardados correctamente', 'success');
            this.toggleVisibility(); // Close the panel after saving
          }
        } catch (error) {
          console.error('Error al guardar los ajustes:', error);
          this.toastService.show('Error al guardar los ajustes', 'error');
        }
      }
    );
  }
}