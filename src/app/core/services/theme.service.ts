import { Injectable, signal, effect, Renderer2, RendererFactory2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private isBrowser: boolean;

  public isDarkMode = signal<boolean>(false);

  constructor(rendererFactory: RendererFactory2, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.renderer = rendererFactory.createRenderer(null, null);

    if (this.isBrowser) {
      const storedTheme = localStorage.getItem('isDarkMode');
      this.isDarkMode.set(storedTheme === 'true');
    }

    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem('isDarkMode', this.isDarkMode().toString());
        if (this.isDarkMode()) {
          this.renderer.addClass(document.body, 'dark-mode');
        } else {
          this.renderer.removeClass(document.body, 'dark-mode');
        }
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(value => !value);
  }
}
