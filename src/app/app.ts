import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule],
  template: `<router-outlet />`
})
export class App {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  constructor() {
    this.matIconRegistry.addSvgIcon(
      'logo',
      // Corregido: La ruta ahora es 'logo.svg' en la raíz
      this.domSanitizer.bypassSecurityTrustResourceUrl('logo.svg') 
    );
  }
}
