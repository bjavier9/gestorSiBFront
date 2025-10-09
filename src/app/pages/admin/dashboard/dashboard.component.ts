import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {

}
