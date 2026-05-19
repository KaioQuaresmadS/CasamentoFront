import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthApiService } from '../../application/api/auth-api.service';

@Component({
  selector: 'app-admin-page',
  imports: [RouterLink],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent {
  private readonly authService = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }
}
