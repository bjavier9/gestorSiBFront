import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CompanyService } from '@core/services/company.service';
import { UserService } from '@core/services/user.service';
import { CompanyUser } from '@core/models/company-user.model';
import { AuthService } from '@core/services/auth.service';
import { BreadcrumbsComponent } from '@features/admin/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '@features/admin/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-users-page',
  standalone: true,
  imports: [AsyncPipe, NgClass, RouterLink, BreadcrumbsComponent, ConfirmDialogComponent],
  templateUrl: './company-users-page.component.html',
  styleUrls: ['./company-users-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyUsersPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly company$ = this.companyService.getCompanyById(this.companyId);

  readonly users = signal<CompanyUser[]>([]);
  readonly isUsersLoading = signal(false);
  readonly usersError = signal<string | null>(null);
  readonly usersFeedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly userStatusLoading = signal<Record<string, boolean>>({});
  readonly pendingUserAction = signal<{ user: CompanyUser; nextStatus: boolean } | null>(null);
  readonly userConfirmDescription = computed(() => {
    const pending = this.pendingUserAction();
    if (!pending) {
      return '';
    }
    const action = pending.nextStatus ? 'activate' : 'deactivate';
    return `Are you sure you want to ${action} ${pending.user.email}?`;
  });
  readonly userConfirmActionText = computed(() => {
    const pending = this.pendingUserAction();
    if (!pending) {
      return 'Confirm';
    }
    return pending.nextStatus ? 'Activate user' : 'Deactivate user';
  });
  readonly userConfirmBusy = computed(() => {
    const pending = this.pendingUserAction();
    if (!pending) {
      return false;
    }
    return this.userStatusLoading()[pending.user.id] ?? false;
  });
  readonly skeletonCards = Array.from({ length: 3 });

  constructor() {
    this.loadUsers();
  }

  requestUserStatusChange(user: CompanyUser): void {
    if (this.userStatusLoading()[user.id]) {
      return;
    }

    const nextStatus = !user.activo;
    this.pendingUserAction.set({
      user,
      nextStatus,
    });
    this.usersFeedback.set(null);
  }

  confirmUserStatusChange(): void {
    const pending = this.pendingUserAction();

    if (!pending) {
      return;
    }

    if (this.userStatusLoading()[pending.user.id]) {
      return;
    }

    this.pendingUserAction.set(null);
    this.performUserStatusChange(pending.user, pending.nextStatus);
  }

  cancelUserStatusChange(): void {
    if (!this.pendingUserAction()) {
      return;
    }

    this.pendingUserAction.set(null);
    this.usersFeedback.set({
      text: 'Action cancelled by the user.',
      tone: 'error',
    });
  }

  private performUserStatusChange(user: CompanyUser, nextStatus: boolean): void {
    this.setUserStatusLoading(user.id, true);
    this.usersFeedback.set(null);

    this.userService
      .setCompanyUserStatus(user.id, nextStatus)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to update user status', error);
          this.usersFeedback.set({
            text: 'Unable to update the user status. Please try again.',
            tone: 'error',
          });
          this.setUserStatusLoading(user.id, false);
          this.pendingUserAction.set(null);
          return of(null);
        }),
      )
      .subscribe((updatedUser) => {
        if (!updatedUser) {
          return;
        }

        this.usersFeedback.set({
          text: `User ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
          tone: 'success',
        });
        this.setUserStatusLoading(user.id, false);
        this.users.update((current) =>
          current.map((existing) =>
            existing.id === updatedUser.id ? { ...existing, activo: updatedUser.activo } : existing
          )
        );
        this.pendingUserAction.set(null);
      });
  }

  private loadUsers(): void {
    this.isUsersLoading.set(true);
    this.usersError.set(null);

    const currentUser = this.authService.currentUser();
    const request$ = currentUser?.isSuperAdmin
      ? this.userService.getAllUsers().pipe(
          map((users) => users.filter((user) => user.companiaCorretajeId === this.companyId))
        )
      : this.userService.getOperationalUsersByCompany();

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to load users', error);
          this.usersError.set('Unable to load the users for this company.');
          return of<CompanyUser[]>([]);
        }),
        finalize(() => this.isUsersLoading.set(false)),
      )
      .subscribe((users) => {
        this.users.set(users);
      });
  }

  private setUserStatusLoading(userId: string, isLoading: boolean): void {
    this.userStatusLoading.update((current) => ({
      ...current,
      [userId]: isLoading,
    }));
  }
}
