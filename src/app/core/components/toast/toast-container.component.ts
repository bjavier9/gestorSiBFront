import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';

import { ToastService } from '../../services/toast.service';
import { ToastTone } from '../../models/toast.model';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  toneBorderClass(tone: ToastTone): string {
    return tone === 'success' ? 'border-emerald-200' : 'border-rose-200';
  }

  iconWrapperClass(tone: ToastTone): string {
    return tone === 'success'
      ? 'bg-emerald-100 text-emerald-600'
      : 'bg-rose-100 text-rose-600';
  }

  closeButtonClass(tone: ToastTone): string {
    return tone === 'success'
      ? 'hover:bg-emerald-50 focus:ring-emerald-400'
      : 'hover:bg-rose-50 focus:ring-rose-400';
  }
}
