import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminToastContainerComponent } from '@features/shared/components/toast-notifications/admin-toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RouterOutlet, AdminToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
