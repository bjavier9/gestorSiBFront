import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

type ConfirmTone = 'primary' | 'success' | 'danger';
type IconVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm action';
  @Input() description = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmTone: ConfirmTone = 'primary';
  @Input() icon: IconVariant = 'info';
  @Input() showIcon = true;
  @Input() busy = false;
  @Input() disableBackdropClose = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private readonly toneClassMap: Record<ConfirmTone, string> = {
    primary: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-300',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-300',
  };

  private readonly iconToneClassMap: Record<IconVariant, string> = {
    info: 'text-slate-400',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  };

  get confirmButtonClasses(): string {
    const tone = this.toneClassMap[this.confirmTone] ?? this.toneClassMap.primary;
    return [
      'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white',
      'focus:outline-none focus:ring-4 transition disabled:cursor-not-allowed disabled:opacity-70',
      tone,
    ].join(' ');
  }

  get iconToneClass(): string {
    return this.iconToneClassMap[this.icon] ?? this.iconToneClassMap.info;
  }

  handleConfirm(): void {
    if (this.busy) {
      return;
    }
    this.confirm.emit();
  }

  handleCancel(): void {
    if (this.busy) {
      return;
    }
    this.cancel.emit();
  }

  handleBackdropClick(): void {
    if (this.busy || this.disableBackdropClose) {
      return;
    }
    this.cancel.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (!this.open || this.busy || this.disableBackdropClose) {
      return;
    }
    event.preventDefault();
    this.cancel.emit();
  }
}
