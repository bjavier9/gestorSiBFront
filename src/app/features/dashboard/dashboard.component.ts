import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { GestionesService } from '@core/services/gestiones.service';
import { ToastService } from '@core/services/toast.service';
import {
  Gestion,
  GestionEstado,
  GestionNota,
  GestionNotaAdjunto,
  GestionPrioridad,
} from '@core/models/gestion.model';

interface SummaryCardConfig {
  key: 'total' | GestionEstado;
  label: string;
  description: string;
  accentClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly authServiceInternal = inject(AuthService);
  private readonly gestionesService = inject(GestionesService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  private readonly summaryConfig: SummaryCardConfig[] = [
    {
      key: 'total',
      label: 'Gestiones Totales',
      description: 'Todas las gestiones registradas',
      accentClass: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20',
    },
    {
      key: 'en_gestion',
      label: 'En gestión',
      description: 'Gestiones en seguimiento activo',
      accentClass: 'bg-sky-500/10 text-sky-600 ring-1 ring-inset ring-sky-500/40',
    },
    {
      key: 'en_tramite',
      label: 'En trámite',
      description: 'Documentación en proceso',
      accentClass: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/40',
    },
    {
      key: 'gestionado_exito',
      label: 'Gestionadas con éxito',
      description: 'Operaciones cerradas positivamente',
      accentClass: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/40',
    },
  ];

  private readonly estadoMetadata: Record<GestionEstado, { label: string; badge: string }> = {
    borrador: {
      label: 'Borrador',
      badge: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    },
    en_gestion: {
      label: 'En gestión',
      badge: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
    },
    en_tramite: {
      label: 'En trámite',
      badge: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
    },
    gestionado_exito: {
      label: 'Gestionado con éxito',
      badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    },
    desistido: {
      label: 'Desistido',
      badge: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
    },
  };

  private readonly prioridadMetadata: Record<
    GestionPrioridad,
    { label: string; badge: string }
  > = {
    baja: {
      label: 'Baja',
      badge: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    },
    media: {
      label: 'Media',
      badge: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
    },
    alta: {
      label: 'Alta',
      badge: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
    },
  };

  protected readonly authService = this.authServiceInternal;

  readonly gestiones = signal<Gestion[]>([]);
  readonly isLoadingGestiones = signal(true);
  readonly searchTerm = signal('');
  readonly selectedGestionId = signal<string | null>(null);

  readonly notas = signal<GestionNota[]>([]);
  readonly isLoadingNotas = signal(false);
  readonly isSubmittingNote = signal(false);
  readonly isUpdatingNote = signal(false);
  readonly deletingNotaIds = signal<Set<string>>(new Set());
  readonly editingNotaId = signal<string | null>(null);

  readonly noteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(1000)],
  });
  readonly editingNoteControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(1000)],
  });

  readonly pendingNoteAttachments = signal<File[]>([]);

  private readonly maxNoteAttachments = 5;
  private readonly maxAttachmentSizeMb = 10;
  private readonly maxAttachmentSizeBytes = this.maxAttachmentSizeMb * 1024 * 1024;
  private readonly allowedAttachmentMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/jpg',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);
  private readonly allowedAttachmentMimePrefixes = ['image/'];
  private readonly allowedAttachmentExtensions = new Set([
    '.jpeg',
    '.jpg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
  ]);
  readonly noteAttachmentLimit = this.maxNoteAttachments;
  readonly noteAttachmentMaxSizeMb = this.maxAttachmentSizeMb;

  readonly currentUser = computed(() => this.authService.currentUser());

  readonly summaryCards = computed(() => {
    const items = this.gestiones();
    return this.summaryConfig.map((card) => {
      const total =
        card.key === 'total'
          ? items.length
          : items.filter((gestion) => gestion.estado === card.key).length;
      return { ...card, total };
    });
  });

  readonly filteredGestiones = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const items = [...this.gestiones()].sort((a, b) => {
      const timeA = new Date(a.fechaActualizacion ?? a.fechaCreacion).getTime();
      const timeB = new Date(b.fechaActualizacion ?? b.fechaCreacion).getTime();
      return timeB - timeA;
    });

    if (!term) {
      return items;
    }

    return items.filter((gestion) => {
      const searchable = [
        gestion.id,
        gestion.tipo,
        gestion.estado,
        gestion.prioridad,
        gestion.leadId,
        gestion.enteId,
        gestion.agenteId,
        gestion.oficinaId,
        gestion.polizaId,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return searchable.some((value) => value.includes(term));
    });
  });

  readonly selectedGestion = computed(
    () => this.gestiones().find((gestion) => gestion.id === this.selectedGestionId()) ?? null,
  );

  ngOnInit(): void {
    this.loadGestiones();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  trackByGestion(_: number, gestion: Gestion): string {
    return gestion.id;
  }

  trackByNota(_: number, nota: GestionNota): string {
    return nota.id;
  }

  estadoLabel(estado: GestionEstado): string {
    return this.estadoMetadata[estado]?.label ?? estado;
  }

  estadoBadgeClass(estado: GestionEstado): string {
    return this.estadoMetadata[estado]?.badge ?? 'bg-slate-100 text-slate-600';
  }

  prioridadLabel(prioridad?: GestionPrioridad | null): string {
    if (!prioridad) {
      return 'Sin prioridad';
    }
    return this.prioridadMetadata[prioridad]?.label ?? prioridad;
  }

  prioridadBadgeClass(prioridad?: GestionPrioridad | null): string {
    if (!prioridad) {
      return 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200';
    }
    return this.prioridadMetadata[prioridad]?.badge ?? 'bg-slate-100 text-slate-500';
  }

  onNoteAttachmentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const files = Array.from(input.files ?? []);
    input.value = '';

    if (!files.length) {
      return;
    }

    const current = this.pendingNoteAttachments();
    const availableSlots = this.maxNoteAttachments - current.length;

    if (availableSlots <= 0) {
      this.toastService.showError(`Solo puedes adjuntar hasta ${this.maxNoteAttachments} archivos por nota.`);
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!this.isAllowedAttachment(file)) {
        this.toastService.showError(`El archivo ${file.name} no es un formato permitido.`);
        continue;
      }

      if (file.size > this.maxAttachmentSizeBytes) {
        this.toastService.showError(
          `El archivo ${file.name} supera los ${this.maxAttachmentSizeMb} MB permitidos.`,
        );
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      return;
    }

    const trimmed = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      this.toastService.showError(`Solo puedes adjuntar hasta ${this.maxNoteAttachments} archivos por nota.`);
    }

    this.pendingNoteAttachments.set([...current, ...trimmed]);
  }

  removePendingAttachment(index: number): void {
    this.pendingNoteAttachments.update((current) => current.filter((_, position) => position !== index));
  }

  clearPendingAttachments(): void {
    this.pendingNoteAttachments.set([]);
  }

  pendingAttachmentBadgeLabel(file: File): string {
    return this.resolveAttachmentMeta(file.type, file.name).label;
  }

  pendingAttachmentBadgeClass(file: File): string {
    return this.resolveAttachmentMeta(file.type, file.name).badgeClass;
  }

  attachmentBadgeLabel(adjunto: GestionNotaAdjunto): string {
    return this.resolveAttachmentMeta(adjunto.mimeType, adjunto.fileName).label;
  }

  attachmentBadgeClass(adjunto: GestionNotaAdjunto): string {
    return this.resolveAttachmentMeta(adjunto.mimeType, adjunto.fileName).badgeClass;
  }

  formatFileSize(size?: number | null): string {
    if (size === undefined || size === null || Number.isNaN(size)) {
      return '—';
    }
    if (size < 1024) {
      return `${size} B`;
    }
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = size / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    const formatted = value >= 10 ? value.toFixed(0) : value.toFixed(1);
    return `${formatted} ${units[unitIndex]}`;
  }

  selectGestion(gestion: Gestion): void {
    if (!gestion || this.selectedGestionId() === gestion.id) {
      return;
    }
    this.selectedGestionId.set(gestion.id);
    this.editingNotaId.set(null);
    this.editingNoteControl.reset('');
    this.noteControl.reset('');
    this.clearPendingAttachments();
    this.loadNotas(gestion.id);
  }

  openGestionDetail(): void {
    const gestion = this.selectedGestion();
    if (!gestion) {
      return;
    }

    const urlTree = this.router.createUrlTree(['/gestiones', gestion.id]);
    const url = this.router.serializeUrl(urlTree);
    const opened = window.open(url, '_blank', 'noopener');
    if (opened) {
      opened.opener = null;
    }
  }

  submitNote(event: Event): void {
    event.preventDefault();
    const gestion = this.selectedGestion();
    if (!gestion || this.noteControl.invalid || this.isSubmittingNote()) {
      this.noteControl.markAsTouched();
      return;
    }

    const attachments = this.pendingNoteAttachments();

    this.isSubmittingNote.set(true);
    this.gestionesService
      .crearNota(gestion.id, { contenido: this.noteControl.value, adjuntos: attachments })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmittingNote.set(false)),
      )
      .subscribe({
        next: (nota) => {
          this.noteControl.reset('');
          this.clearPendingAttachments();
          this.notas.update((current) => [nota, ...current]);
          this.toastService.showSuccess('Nota agregada correctamente.');
        },
        error: (error: unknown) => {
          console.error('Error al crear nota', error);
          this.toastService.showError('No se pudo guardar la nota. Intenta nuevamente.');
        },
      });
  }

  startEditNota(nota: GestionNota): void {
    this.editingNotaId.set(nota.id);
    this.editingNoteControl.setValue(nota.contenido);
  }

  cancelEditNota(): void {
    this.editingNotaId.set(null);
    this.editingNoteControl.reset('');
  }

  saveEditedNota(notaId: string): void {
    const gestion = this.selectedGestion();
    if (!gestion || this.editingNoteControl.invalid || this.isUpdatingNote()) {
      this.editingNoteControl.markAsTouched();
      return;
    }

    this.isUpdatingNote.set(true);
    this.gestionesService
      .actualizarNota(gestion.id, notaId, { contenido: this.editingNoteControl.value })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isUpdatingNote.set(false)),
      )
      .subscribe({
        next: (notaActualizada) => {
          this.notas.update((current) =>
            current.map((nota) => (nota.id === notaActualizada.id ? notaActualizada : nota)),
          );
          this.cancelEditNota();
          this.toastService.showSuccess('Nota actualizada correctamente.');
        },
        error: (error: unknown) => {
          console.error('Error al actualizar nota', error);
          this.toastService.showError('No se pudo actualizar la nota. Intenta nuevamente.');
        },
      });
  }

  deleteNota(notaId: string): void {
    const gestion = this.selectedGestion();
    if (!gestion || this.isDeletingNota(notaId)) {
      return;
    }

    this.deletingNotaIds.update((current) => {
      const next = new Set(current);
      next.add(notaId);
      return next;
    });

    this.gestionesService
      .eliminarNota(gestion.id, notaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.deletingNotaIds.update((current) => {
            const next = new Set(current);
            next.delete(notaId);
            return next;
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.notas.update((current) => current.filter((nota) => nota.id !== notaId));
          this.toastService.showSuccess('Nota eliminada.');
        },
        error: (error: unknown) => {
          console.error('Error al eliminar nota', error);
          this.toastService.showError('No se pudo eliminar la nota. Intenta nuevamente.');
        },
      });
  }

  isDeletingNota(notaId: string): boolean {
    return this.deletingNotaIds().has(notaId);
  }

  refreshGestiones(): void {
    this.loadGestiones();
  }

  private resolveAttachmentMeta(
    mimeType?: string,
    fileName?: string,
  ): { label: string; badgeClass: string } {
    const normalizedMime = (mimeType ?? '').toLowerCase();
    const extension = this.extractExtension(fileName);

    const isImage =
      normalizedMime.startsWith('image/') ||
      ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'].includes(extension);

    if (isImage) {
      return {
        label: 'IMG',
        badgeClass: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
      };
    }

    if (normalizedMime === 'application/pdf' || extension === '.pdf') {
      return {
        label: 'PDF',
        badgeClass: 'bg-rose-100 text-rose-600 ring-1 ring-inset ring-rose-200',
      };
    }

    const isWord =
      normalizedMime.includes('word') || extension === '.doc' || extension === '.docx';

    if (isWord) {
      return {
        label: 'DOC',
        badgeClass: 'bg-sky-100 text-sky-600 ring-1 ring-inset ring-sky-200',
      };
    }

    const isExcel =
      normalizedMime.includes('excel') ||
      normalizedMime.includes('spreadsheet') ||
      extension === '.xls' ||
      extension === '.xlsx';

    if (isExcel) {
      return {
        label: 'XLS',
        badgeClass: 'bg-emerald-100 text-emerald-600 ring-1 ring-inset ring-emerald-200',
      };
    }

    const suffix = extension ? extension.replace('.', '').slice(0, 3).toUpperCase() : 'FILE';

    return {
      label: suffix || 'FILE',
      badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    };
  }

  private isAllowedAttachment(file: File): boolean {
    const mimeType = (file.type ?? '').toLowerCase();
    if (this.allowedAttachmentMimeTypes.has(mimeType)) {
      return true;
    }
    if (this.allowedAttachmentMimePrefixes.some((prefix) => mimeType.startsWith(prefix))) {
      return true;
    }
    const extension = this.extractExtension(file.name);
    return extension ? this.allowedAttachmentExtensions.has(extension) : false;
  }

  private extractExtension(fileName?: string): string {
    if (!fileName) {
      return '';
    }
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return fileName.substring(lastDot).toLowerCase();
  }

  private loadGestiones(): void {
    this.isLoadingGestiones.set(true);
    this.gestionesService
      .getGestiones()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingGestiones.set(false)),
      )
      .subscribe({
        next: (gestiones) => {
          this.gestiones.set(gestiones);

          const selectedId = this.selectedGestionId();
          const isSelectedValid = selectedId
            ? gestiones.some((gestion) => gestion.id === selectedId)
            : false;

          if (!isSelectedValid && gestiones.length > 0) {
            this.selectGestion(gestiones[0]);
          } else if (!gestiones.length) {
            this.selectedGestionId.set(null);
            this.notas.set([]);
          }
        },
        error: (error: unknown) => {
          console.error('Error al cargar gestiones', error);
          this.toastService.showError('No se pudieron cargar las gestiones.');
          this.gestiones.set([]);
        },
      });
  }

  private loadNotas(gestionId: string): void {
    this.isLoadingNotas.set(true);
    this.gestionesService
      .getNotas(gestionId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingNotas.set(false)),
      )
      .subscribe({
        next: (notas) => {
          const sorted = [...notas].sort(
            (left, right) =>
              new Date(right.fechaCreacion).getTime() - new Date(left.fechaCreacion).getTime(),
          );
          this.notas.set(sorted);
        },
        error: (error: unknown) => {
          console.error('Error al cargar notas', error);
          this.toastService.showError('No se pudieron cargar las notas de la gestión.');
          this.notas.set([]);
        },
      });
  }
}
