import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  public toasts: Toast[] = [];
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private currentId = 0;

  getToasts() {
    return this.toasts$.asObservable();
  }

  show(message: string, type: ToastType, duration: number = 3000) {
    const toast: Toast = {
      id: this.currentId++,
      message,
      type,
      duration
    };
    
    this.toasts.push(toast);
    this.toasts$.next([...this.toasts]);
    
    setTimeout(() => this.dismiss(toast.id), duration);
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next([...this.toasts]);
  }
}