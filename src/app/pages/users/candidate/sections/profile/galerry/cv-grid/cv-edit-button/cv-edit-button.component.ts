import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, HostListener, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-cv-edit-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-edit-button.component.html',
  styleUrls: ['./cv-edit-button.component.css'],
})
export class CvEditButtonComponent {
  @Output() optionSelected = new EventEmitter<string>();
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
    this.optionSelected.emit(option);
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