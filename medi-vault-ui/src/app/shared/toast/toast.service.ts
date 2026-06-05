import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastState = signal<ToastMessage[]>([]);
  private nextId = 1;

  readonly toasts = this.toastState.asReadonly();

  show(message: string, type: ToastType = 'info', durationMs = 4500): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      message,
      type
    };

    this.toastState.update((currentToasts) => [toast, ...currentToasts]);

    globalThis.setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  dismiss(id: number): void {
    this.toastState.update((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }
}
