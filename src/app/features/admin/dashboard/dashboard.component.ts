import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [RouterLink, MatCardModule, MatIconModule], // Añadimos MatCardModule y MatIconModule
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {}
