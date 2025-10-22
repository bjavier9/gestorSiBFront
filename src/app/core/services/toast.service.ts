import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { ToastMessage, ToastTone } from '../models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly document = inject(DOCUMENT);

  private readonly toastsSignal = signal<ToastMessage[]>([]);
  private readonly timeoutRegistry = new Map<string, number>();
  private idCounter = 0;

  readonly toasts = this.toastsSignal.asReadonly();

  show(text: string, tone: ToastTone, autoCloseMs = 5000): string {
    const id = this.generateId();
    const toast: ToastMessage = { id, text, tone };

    this.toastsSignal.update((current) => [...current, toast]);

    if (autoCloseMs > 0) {
      const timeoutId = this.windowRef()?.setTimeout(() => this.dismiss(id), autoCloseMs);
      if (typeof timeoutId === 'number') {
        this.timeoutRegistry.set(id, timeoutId);
      }
    }

    return id;
  }

  showSuccess(text: string, autoCloseMs = 5000): string {
    return this.show(text, 'success', autoCloseMs);
  }

  showError(text: string, autoCloseMs = 5000): string {
    return this.show(text, 'error', autoCloseMs);
  }

  dismiss(id: string): void {
    const timeoutId = this.timeoutRegistry.get(id);
    if (typeof timeoutId === 'number') {
      this.windowRef()?.clearTimeout(timeoutId);
      this.timeoutRegistry.delete(id);
    }

    this.toastsSignal.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.toastsSignal().forEach((toast) => this.dismiss(toast.id));
  }

  private generateId(): string {
    this.idCounter = (this.idCounter + 1) % Number.MAX_SAFE_INTEGER;
    return `toast-${this.idCounter}-${Date.now()}`;
  }

  private windowRef(): Window | null {
    return this.document?.defaultView ?? null;
  }
}
