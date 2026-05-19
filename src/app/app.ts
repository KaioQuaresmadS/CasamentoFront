import { Component } from '@angular/core';
import { WeddingPageComponent } from './pages/wedding-page/wedding-page.component';

@Component({
  selector: 'app-root',
  imports: [WeddingPageComponent],
  template: '<app-wedding-page />'
})
export class App {}
