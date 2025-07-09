import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, HostListener, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-edit-picture-and-data-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-picture-and-data-button.component.html',
  styleUrls: ['./edit-picture-and-data-button.component.css'],
})
export class EditPictureAndDataButtonComponent {
  @Output() editProfilePicture = new EventEmitter<void>();
  @Output() editPersonalData = new EventEmitter<void>();
  @Output() backToPrincipal = new EventEmitter<void>();
  showOptions = false;

  constructor(private cdr: ChangeDetectorRef) {}

  onClose(event: Event): void {
    event.stopPropagation(); 
    this.backToPrincipal.emit();
    this.showOptions = false;
    this.cdr.detectChanges();
  }

  toggleOptions(event: Event) {
    event.stopPropagation();
    this.showOptions = !this.showOptions;
    this.cdr.detectChanges();
  }

  selectOption(option: string, event: Event) {
    event.stopPropagation();
    
    switch(option) {
      case 'foto-perfil':
        this.editProfilePicture.emit();
        break;
      case 'datos-personales':
        this.editPersonalData.emit();
        break;
    }
    
    this.closePopover();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.showOptions && !this.isInsidePopover(event.target)) {
      this.closePopover();
    }
  }

  private isInsidePopover(target: EventTarget | null): boolean {
    const popover = document.querySelector('.popover');
    return !!popover && popover.contains(target as Node);
  }

  private closePopover() {
    this.showOptions = false;
    this.cdr.detectChanges();
  }
}