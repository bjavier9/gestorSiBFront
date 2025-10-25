import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GestionesService } from '@core/services/gestiones.service';
import { ToastService } from '@core/services/toast.service';
import {
  Gestion,
  GestionEstado,
  GestionNota,
  GestionNotaAdjunto,
  GestionPrioridad,
} from '@core/models/gestion.model';

@Component({
  selector: 'app-gestion-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gestion-detail-page.component.html',
  styleUrls: ['./gestion-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gestionesService = inject(GestionesService);
  private readonly toastService = inject(ToastService);

  readonly gestion = signal<Gestion | null>(null);
  readonly notas = signal<GestionNota[]>([]);
  readonly isLoadingGestion = signal(true);
  readonly isLoadingNotas = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly estadoMetadata: Record<GestionEstado, { label: string; badge: string }> = {
    borrador: { label: 'Borrador', badge: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200' },
    en_gestion: { label: 'En gestion', badge: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200' },
    en_tramite: { label: 'En tramite', badge: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200' },
    gestionado_exito: {
      label: 'Gestionado con exito',
      badge: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    },
    desistido: { label: 'Desistido', badge: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200' },
  };

  readonly prioridadMetadata: Record<GestionPrioridad, { label: string; badge: string }> = {
    baja: { label: 'Baja', badge: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200' },
    media: { label: 'Media', badge: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200' },
    alta: { label: 'Alta', badge: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200' },
  };

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const gestionId = params.get('gestionId');
      if (!gestionId) {
        this.errorMessage.set('No se encontro el identificador de la gestion.');
        return;
      }

      this.loadGestion(gestionId);
      this.loadNotas(gestionId);
    });
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

  trackByNota(_: number, nota: GestionNota): string {
    return nota.id;
  }

  private loadGestion(gestionId: string): void {
    this.isLoadingGestion.set(true);
    this.errorMessage.set(null);

    this.gestionesService
      .getGestionById(gestionId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingGestion.set(false)),
      )
      .subscribe({
        next: (gestion) => this.gestion.set(gestion),
        error: (error: unknown) => {
          console.error('Error al cargar la gestion', error);
          this.errorMessage.set('No se pudo cargar la informacion de la gestion.');
          this.toastService.showError('No se pudo cargar la informacion de la gestion.');
        },
      });
  }

  private loadNotas(gestionId: string): void {
    this.isLoadingNotas.set(true);
    this.notas.set([]);

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
          console.error('Error al cargar las notas', error);
          this.toastService.showError('No se pudieron cargar las notas de la gestion.');
          this.notas.set([]);
        },
      });
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
}
