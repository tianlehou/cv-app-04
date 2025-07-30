import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  countdown?: number;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationModalService {
  private isVisible$ = new BehaviorSubject<boolean>(false);
  private config$ = new BehaviorSubject<ConfirmationConfig>({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    countdown: 0
  });
  private confirmCallback: (() => void) | null = null;
  private cancelCallback: (() => void) | null = null;

  get isVisible() {
    return this.isVisible$.asObservable();
  }

  get config() {
    return this.config$.asObservable();
  }

  show(config: ConfirmationConfig, onConfirm: () => void, onCancel?: () => void) {
    this.config$.next({
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      ...config
    });
    this.confirmCallback = onConfirm;
    this.cancelCallback = onCancel || null;
    this.isVisible$.next(true);
  }

  hide() {
    this.isVisible$.next(false);
  }

  onConfirm() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.hide();
  }

  onCancel() {
    if (this.cancelCallback) {
      this.cancelCallback();
    }
    this.hide();
  }
}